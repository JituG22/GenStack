import { UserNew, IUserDocumentNew } from "../models/User-new";
import mongoose from "mongoose";

export interface UserAnalytics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    averageSessionDuration: number;
  };
  engagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    retentionRate: number;
  };
  features: {
    mostUsedFeatures: Array<{ feature: string; usage: number }>;
    templatesCreated: number;
    projectsCreated: number;
    collaborativeSessions: number;
  };
  collaboration: {
    usersWithCollabEnabled: number;
    averageFollowers: number;
    mostFollowedUsers: Array<{ user: string; followers: number }>;
    teamParticipation: number;
  };
  preferences: {
    themeDistribution: { light: number; dark: number; auto: number };
    languageDistribution: Record<string, number>;
    notificationSettings: {
      emailEnabled: number;
      realTimeEnabled: number;
      collaborativeEditingEnabled: number;
    };
  };
}

export interface UserPersonalAnalytics {
  activitySummary: {
    totalLogins: number;
    lastLoginDays: number;
    averageSessionsPerWeek: number;
    longestStreak: number;
    currentStreak: number;
  };
  productivity: {
    templatesCreated: number;
    projectsCreated: number;
    collaborativeSessions: number;
    featuresExplored: number;
    preferredWorkingHours: string[];
  };
  social: {
    followersGained: number;
    following: number;
    teamContributions: number;
    collaborationScore: number;
  };
  growth: {
    skillsAcquired: string[];
    achievementsBadges: string[];
    recommendedFeatures: string[];
    learningProgress: number;
  };
}

class UserAnalyticsService {
  /**
   * Get comprehensive platform analytics for admin dashboard
   */
  async getPlatformAnalytics(organizationId?: string): Promise<UserAnalytics> {
    const filter = organizationId ? { organization: organizationId } : {};

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Overview metrics
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      recentSessions,
    ] = await Promise.all([
      UserNew.countDocuments(filter),
      UserNew.countDocuments({ ...filter, isActive: true }),
      UserNew.countDocuments({
        ...filter,
        createdAt: { $gte: today },
      }),
      UserNew.countDocuments({
        ...filter,
        createdAt: { $gte: weekAgo },
      }),
      UserNew.find({
        ...filter,
        lastActivity: { $gte: weekAgo },
      })
        .select("loginHistory")
        .lean(),
    ]);

    // Calculate average session duration from login history
    let totalSessions = 0;
    let totalDuration = 0;
    recentSessions.forEach((user) => {
      const sessions = user.loginHistory || [];
      totalSessions += sessions.length;
      // Estimate session duration (simplified)
      sessions.forEach((session, index) => {
        if (index > 0) {
          const prevSession = sessions[index - 1];
          const duration =
            new Date(session.timestamp).getTime() -
            new Date(prevSession.timestamp).getTime();
          if (duration < 4 * 60 * 60 * 1000) {
            // Less than 4 hours (reasonable session)
            totalDuration += duration;
          }
        }
      });
    });

    const averageSessionDuration =
      totalSessions > 0 ? totalDuration / totalSessions / (1000 * 60) : 0; // in minutes

    // Engagement metrics
    const [dailyActive, weeklyActive, monthlyActive] = await Promise.all([
      UserNew.countDocuments({
        ...filter,
        lastActivity: { $gte: today },
      }),
      UserNew.countDocuments({
        ...filter,
        lastActivity: { $gte: weekAgo },
      }),
      UserNew.countDocuments({
        ...filter,
        lastActivity: { $gte: monthAgo },
      }),
    ]);

    // Feature usage aggregation
    const featureUsageAgg = await UserNew.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTemplates: { $sum: "$featureUsage.templatesCreated" },
          totalProjects: { $sum: "$featureUsage.projectsCreated" },
          totalCollabSessions: { $sum: "$featureUsage.collaborativeSessions" },
          allFavorites: { $push: "$featureUsage.favoriteFeatures" },
        },
      },
    ]);

    // Collaboration metrics
    const collaborationStats = await UserNew.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          collabEnabled: {
            $sum: {
              $cond: ["$collaborationSettings.allowRealTimeEditing", 1, 0],
            },
          },
          totalFollowers: { $sum: { $size: "$followers" } },
          totalFollowing: { $sum: { $size: "$following" } },
          teamMembers: {
            $sum: {
              $cond: [{ $gt: [{ $size: "$teams" }, 0] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Preferences distribution
    const preferencesStats = await UserNew.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          lightTheme: {
            $sum: { $cond: [{ $eq: ["$preferences.theme", "light"] }, 1, 0] },
          },
          darkTheme: {
            $sum: { $cond: [{ $eq: ["$preferences.theme", "dark"] }, 1, 0] },
          },
          autoTheme: {
            $sum: { $cond: [{ $eq: ["$preferences.theme", "auto"] }, 1, 0] },
          },
          emailEnabled: {
            $sum: { $cond: ["$preferences.notifications.email", 1, 0] },
          },
          realTimeEnabled: {
            $sum: { $cond: ["$preferences.notifications.realTime", 1, 0] },
          },
          collabEditingEnabled: {
            $sum: {
              $cond: ["$preferences.notifications.collaborativEditing", 1, 0],
            },
          },
          languages: { $push: "$preferences.language" },
        },
      },
    ]);

    // Process favorite features
    let mostUsedFeatures: Array<{ feature: string; usage: number }> = [];
    if (featureUsageAgg.length > 0 && featureUsageAgg[0].allFavorites) {
      const allFavorites = featureUsageAgg[0].allFavorites.flat();
      const featureCounts: Record<string, number> = {};
      allFavorites.forEach((feature: string) => {
        featureCounts[feature] = (featureCounts[feature] || 0) + 1;
      });
      mostUsedFeatures = Object.entries(featureCounts)
        .map(([feature, usage]) => ({ feature, usage }))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 10);
    }

    // Process language distribution
    let languageDistribution: Record<string, number> = {};
    if (preferencesStats.length > 0 && preferencesStats[0].languages) {
      preferencesStats[0].languages.forEach((lang: string) => {
        languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
      });
    }

    const retentionRate =
      totalUsers > 0 ? (weeklyActive / totalUsers) * 100 : 0;
    const avgFollowers =
      totalUsers > 0 && collaborationStats.length > 0
        ? collaborationStats[0].totalFollowers / totalUsers
        : 0;

    return {
      overview: {
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisWeek,
        averageSessionDuration: Math.round(averageSessionDuration),
      },
      engagement: {
        dailyActiveUsers: dailyActive,
        weeklyActiveUsers: weeklyActive,
        monthlyActiveUsers: monthlyActive,
        retentionRate: Math.round(retentionRate * 100) / 100,
      },
      features: {
        mostUsedFeatures,
        templatesCreated: featureUsageAgg[0]?.totalTemplates || 0,
        projectsCreated: featureUsageAgg[0]?.totalProjects || 0,
        collaborativeSessions: featureUsageAgg[0]?.totalCollabSessions || 0,
      },
      collaboration: {
        usersWithCollabEnabled: collaborationStats[0]?.collabEnabled || 0,
        averageFollowers: Math.round(avgFollowers * 100) / 100,
        mostFollowedUsers: [], // Could be populated with additional query
        teamParticipation: collaborationStats[0]?.teamMembers || 0,
      },
      preferences: {
        themeDistribution: {
          light: preferencesStats[0]?.lightTheme || 0,
          dark: preferencesStats[0]?.darkTheme || 0,
          auto: preferencesStats[0]?.autoTheme || 0,
        },
        languageDistribution,
        notificationSettings: {
          emailEnabled: preferencesStats[0]?.emailEnabled || 0,
          realTimeEnabled: preferencesStats[0]?.realTimeEnabled || 0,
          collaborativeEditingEnabled:
            preferencesStats[0]?.collabEditingEnabled || 0,
        },
      },
    };
  }

  /**
   * Get personalized analytics for a specific user
   */
  async getUserPersonalAnalytics(
    userId: string
  ): Promise<UserPersonalAnalytics> {
    const user = await UserNew.findById(userId).lean();
    if (!user) {
      throw new Error("User not found");
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Activity analysis
    const loginHistory = user.loginHistory || [];
    const totalLogins = loginHistory.length;
    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
    const lastLoginDays = lastLogin
      ? Math.floor(
          (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    // Calculate streaks (simplified)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedLogins = loginHistory
      .map((l) => new Date(l.timestamp))
      .sort((a, b) => b.getTime() - a.getTime());

    for (let i = 0; i < sortedLogins.length - 1; i++) {
      const daysDiff = Math.floor(
        (sortedLogins[i].getTime() - sortedLogins[i + 1].getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysDiff <= 1) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Working hours analysis (simplified)
    const workingHours = loginHistory.map((l) =>
      new Date(l.timestamp).getHours()
    );
    const hourCounts: Record<number, number> = {};
    workingHours.forEach((hour) => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const preferredHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    // Skills and achievements (simplified - would be more complex in real implementation)
    const featuresExplored = user.featureUsage.favoriteFeatures.length;
    const skillsAcquired = [];
    const achievementsBadges = [];

    if (user.featureUsage.templatesCreated > 5) {
      skillsAcquired.push("Template Master");
      achievementsBadges.push("template-creator");
    }
    if (user.featureUsage.projectsCreated > 10) {
      skillsAcquired.push("Project Builder");
      achievementsBadges.push("project-master");
    }
    if (user.featureUsage.collaborativeSessions > 20) {
      skillsAcquired.push("Collaboration Expert");
      achievementsBadges.push("collaboration-pro");
    }
    if (user.followers.length > 5) {
      skillsAcquired.push("Community Leader");
      achievementsBadges.push("community-leader");
    }

    // Recommendations based on usage patterns
    const recommendedFeatures = [];
    if (user.featureUsage.templatesCreated === 0)
      recommendedFeatures.push("templates");
    if (user.featureUsage.collaborativeSessions < 3)
      recommendedFeatures.push("collaboration");
    if (user.following.length === 0)
      recommendedFeatures.push("social-networking");
    if (!user.collaborationSettings.allowRealTimeEditing)
      recommendedFeatures.push("real-time-editing");

    const collaborationScore = Math.min(
      100,
      user.featureUsage.collaborativeSessions * 2 +
        user.followers.length * 3 +
        user.following.length * 1 +
        user.teams.length * 5
    );

    const learningProgress = Math.min(
      100,
      featuresExplored * 10 +
        skillsAcquired.length * 20 +
        user.featureUsage.templatesCreated * 2 +
        user.featureUsage.projectsCreated * 3
    );

    return {
      activitySummary: {
        totalLogins,
        lastLoginDays,
        averageSessionsPerWeek: Math.round((totalLogins / 4) * 100) / 100, // Rough estimate
        longestStreak,
        currentStreak,
      },
      productivity: {
        templatesCreated: user.featureUsage.templatesCreated,
        projectsCreated: user.featureUsage.projectsCreated,
        collaborativeSessions: user.featureUsage.collaborativeSessions,
        featuresExplored,
        preferredWorkingHours: preferredHours,
      },
      social: {
        followersGained: user.followers.length,
        following: user.following.length,
        teamContributions: user.teams.length,
        collaborationScore: Math.round(collaborationScore),
      },
      growth: {
        skillsAcquired,
        achievementsBadges,
        recommendedFeatures,
        learningProgress: Math.round(learningProgress),
      },
    };
  }

  /**
   * Get user activity timeline for the past month
   */
  async getUserActivityTimeline(
    userId: string,
    days: number = 30
  ): Promise<
    Array<{
      date: string;
      logins: number;
      templatesCreated: number;
      projectsCreated: number;
      collaborativeSessions: number;
    }>
  > {
    const user = await UserNew.findById(userId).lean();
    if (!user) {
      throw new Error("User not found");
    }

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Create array of dates
    const timeline = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];

      // Count activities for this date (simplified - in real app would track daily changes)
      const dayLogins = user.loginHistory.filter(
        (login) =>
          new Date(login.timestamp).toISOString().split("T")[0] === dateStr
      ).length;

      timeline.push({
        date: dateStr,
        logins: dayLogins,
        templatesCreated: 0, // Would need daily tracking
        projectsCreated: 0, // Would need daily tracking
        collaborativeSessions: 0, // Would need daily tracking
      });
    }

    return timeline;
  }

  /**
   * Generate user recommendations based on behavior patterns
   */
  async generateUserRecommendations(userId: string): Promise<{
    features: string[];
    users: Array<{ userId: string; reason: string; score: number }>;
    content: Array<{ type: string; title: string; description: string }>;
  }> {
    const user = await UserNew.findById(userId).populate("organization").lean();
    if (!user) {
      throw new Error("User not found");
    }

    const recommendations = {
      features: [] as string[],
      users: [] as Array<{ userId: string; reason: string; score: number }>,
      content: [] as Array<{
        type: string;
        title: string;
        description: string;
      }>,
    };

    // Feature recommendations based on usage patterns
    if (user.featureUsage.templatesCreated === 0) {
      recommendations.features.push("templates");
      recommendations.content.push({
        type: "tutorial",
        title: "Getting Started with Templates",
        description:
          "Learn how to create and use templates to speed up your workflow",
      });
    }

    if (user.featureUsage.collaborativeSessions < 3) {
      recommendations.features.push("collaboration");
      recommendations.content.push({
        type: "guide",
        title: "Collaborative Development Guide",
        description:
          "Discover the power of real-time collaboration with your team",
      });
    }

    if (user.following.length === 0) {
      recommendations.features.push("social");
      recommendations.content.push({
        type: "tip",
        title: "Connect with Your Team",
        description:
          "Start following colleagues to see their latest projects and get inspired",
      });
    }

    // User recommendations (similar users or potential collaborators)
    const similarUsers = await UserNew.find({
      _id: { $ne: userId },
      organization: user.organization,
      isActive: true,
      $or: [
        {
          "featureUsage.favoriteFeatures": {
            $in: user.featureUsage.favoriteFeatures,
          },
        },
        { "preferences.language": user.preferences.language },
        { teams: { $in: user.teams } },
      ],
    })
      .limit(5)
      .lean();

    similarUsers.forEach((similarUser) => {
      let score = 0;
      let reason = "Similar interests";

      // Calculate similarity score
      const commonFeatures = user.featureUsage.favoriteFeatures.filter((f) =>
        similarUser.featureUsage.favoriteFeatures.includes(f)
      ).length;
      score += commonFeatures * 20;

      if (similarUser.preferences.language === user.preferences.language) {
        score += 10;
        reason = "Same language preference";
      }

      const commonTeams = user.teams.filter((t) =>
        similarUser.teams.some((st) => st.toString() === t.toString())
      ).length;
      if (commonTeams > 0) {
        score += commonTeams * 15;
        reason = "Team member";
      }

      if (score > 0) {
        recommendations.users.push({
          userId: similarUser._id.toString(),
          reason,
          score,
        });
      }
    });

    // Sort user recommendations by score
    recommendations.users.sort((a, b) => b.score - a.score);

    return recommendations;
  }

  /**
   * Get leaderboard for different metrics
   */
  async getLeaderboard(
    metric: string,
    limit: number = 10
  ): Promise<
    Array<{
      userId: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      value: number;
      rank: number;
    }>
  > {
    let sortField = "";
    let valueField = "";

    switch (metric) {
      case "templates":
        sortField = "featureUsage.templatesCreated";
        valueField = "templatesCreated";
        break;
      case "projects":
        sortField = "featureUsage.projectsCreated";
        valueField = "projectsCreated";
        break;
      case "collaboration":
        sortField = "featureUsage.collaborativeSessions";
        valueField = "collaborativeSessions";
        break;
      case "followers":
        sortField = "followers";
        valueField = "followersCount";
        break;
      default:
        sortField = "featureUsage.collaborativeSessions";
        valueField = "collaborativeSessions";
    }

    let aggregationPipeline: any[] = [
      { $match: { isActive: true } },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          avatar: 1,
          value:
            metric === "followers" ? { $size: "$followers" } : `$${sortField}`,
        },
      },
      { $sort: { value: -1 } },
      { $limit: limit },
    ];

    const results = await UserNew.aggregate(aggregationPipeline);

    return results.map((user, index) => ({
      userId: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      value: user.value,
      rank: index + 1,
    }));
  }
}

export const userAnalyticsService = new UserAnalyticsService();
