import express from "express";
import { auth } from "../middleware/auth";

const router = express.Router();

// Quick stats endpoint for dashboard
router.get("/quick-stats", auth, async (req, res) => {
  try {
    // Mock data for now - replace with actual database queries
    const quickStats = {
      personalStats: {
        totalProjects: 5,
        totalNodes: 47,
        weeklyActivity: 23,
        rank: 12,
      },
      platformStats: {
        totalUsers: 1247,
        activeUsers: 89,
        totalProjects: 2856,
        growthRate: 15.2,
      },
    };

    res.json(quickStats);
  } catch (error) {
    console.error("Error fetching quick stats:", error);
    res.status(500).json({ error: "Failed to fetch quick stats" });
  }
});

// Personal analytics endpoint
router.get("/personal", auth, async (req, res) => {
  try {
    // Mock data for now - replace with actual database queries
    const personalMetrics = {
      overview: {
        totalProjects: 5,
        totalNodes: 47,
        totalConnections: 89,
        totalTimeSpent: 2340, // minutes
        rankPosition: 12,
        totalUsers: 1247,
      },
      activity: {
        daily: [
          { date: "2024-01-15", projects: 2, nodes: 8, time: 120 },
          { date: "2024-01-16", projects: 1, nodes: 12, time: 180 },
          { date: "2024-01-17", projects: 3, nodes: 15, time: 240 },
          { date: "2024-01-18", projects: 1, nodes: 6, time: 90 },
          { date: "2024-01-19", projects: 2, nodes: 10, time: 150 },
          { date: "2024-01-20", projects: 1, nodes: 8, time: 120 },
          { date: "2024-01-21", projects: 2, nodes: 14, time: 200 },
        ],
        weekly: [
          { week: "Week 1", projects: 8, nodes: 45, time: 600 },
          { week: "Week 2", projects: 12, nodes: 67, time: 780 },
          { week: "Week 3", projects: 6, nodes: 34, time: 450 },
          { week: "Week 4", projects: 10, nodes: 56, time: 720 },
        ],
        monthly: [
          { month: "Dec", projects: 25, nodes: 134, time: 1200 },
          { month: "Jan", projects: 32, nodes: 189, time: 1560 },
          { month: "Feb", projects: 28, nodes: 156, time: 1340 },
        ],
      },
      performance: {
        projectsCreated: [
          { date: "2024-01-15", count: 2 },
          { date: "2024-01-16", count: 1 },
          { date: "2024-01-17", count: 3 },
          { date: "2024-01-18", count: 1 },
          { date: "2024-01-19", count: 2 },
          { date: "2024-01-20", count: 1 },
          { date: "2024-01-21", count: 2 },
        ],
        nodesCreated: [
          { date: "2024-01-15", count: 8 },
          { date: "2024-01-16", count: 12 },
          { date: "2024-01-17", count: 15 },
          { date: "2024-01-18", count: 6 },
          { date: "2024-01-19", count: 10 },
          { date: "2024-01-20", count: 8 },
          { date: "2024-01-21", count: 14 },
        ],
        timeSpent: [
          { date: "2024-01-15", hours: 2 },
          { date: "2024-01-16", hours: 3 },
          { date: "2024-01-17", hours: 4 },
          { date: "2024-01-18", hours: 1.5 },
          { date: "2024-01-19", hours: 2.5 },
          { date: "2024-01-20", hours: 2 },
          { date: "2024-01-21", hours: 3.5 },
        ],
      },
      achievements: [
        {
          id: "first-project",
          title: "First Project",
          description: "Create your first project",
          earned: true,
          earnedAt: "2024-01-15T10:00:00Z",
          progress: 1,
          maxProgress: 1,
        },
        {
          id: "node-creator",
          title: "Node Creator",
          description: "Create 50 nodes",
          earned: false,
          progress: 47,
          maxProgress: 50,
        },
        {
          id: "collaborator",
          title: "Team Player",
          description: "Collaborate on 10 projects",
          earned: false,
          progress: 3,
          maxProgress: 10,
        },
        {
          id: "time-master",
          title: "Time Master",
          description: "Spend 100 hours on the platform",
          earned: false,
          progress: 39,
          maxProgress: 100,
        },
      ],
    };

    res.json(personalMetrics);
  } catch (error) {
    console.error("Error fetching personal metrics:", error);
    res.status(500).json({ error: "Failed to fetch personal metrics" });
  }
});

// Platform analytics endpoint
router.get("/platform", auth, async (req, res) => {
  try {
    // Mock data for now - replace with actual database queries
    const platformMetrics = {
      overview: {
        totalUsers: 1247,
        activeUsers: 89,
        totalProjects: 2856,
        totalNodes: 15847,
        totalConnections: 34521,
        systemUptime: 720, // hours
      },
      growth: {
        userGrowth: [
          { date: "2024-01-15", users: 1200, activeUsers: 78 },
          { date: "2024-01-16", users: 1210, activeUsers: 82 },
          { date: "2024-01-17", users: 1225, activeUsers: 85 },
          { date: "2024-01-18", users: 1230, activeUsers: 79 },
          { date: "2024-01-19", users: 1240, activeUsers: 88 },
          { date: "2024-01-20", users: 1245, activeUsers: 92 },
          { date: "2024-01-21", users: 1247, activeUsers: 89 },
        ],
        projectGrowth: [
          { date: "2024-01-15", projects: 2800, nodes: 15200 },
          { date: "2024-01-16", projects: 2810, nodes: 15350 },
          { date: "2024-01-17", projects: 2825, nodes: 15500 },
          { date: "2024-01-18", projects: 2830, nodes: 15620 },
          { date: "2024-01-19", projects: 2840, nodes: 15750 },
          { date: "2024-01-20", projects: 2850, nodes: 15820 },
          { date: "2024-01-21", projects: 2856, nodes: 15847 },
        ],
        engagementRate: [
          { date: "2024-01-15", rate: 65 },
          { date: "2024-01-16", rate: 68 },
          { date: "2024-01-17", rate: 70 },
          { date: "2024-01-18", rate: 64 },
          { date: "2024-01-19", rate: 71 },
          { date: "2024-01-20", rate: 74 },
          { date: "2024-01-21", rate: 72 },
        ],
      },
      usage: {
        dailyActive: [
          { date: "2024-01-15", users: 78 },
          { date: "2024-01-16", users: 82 },
          { date: "2024-01-17", users: 85 },
          { date: "2024-01-18", users: 79 },
          { date: "2024-01-19", users: 88 },
          { date: "2024-01-20", users: 92 },
          { date: "2024-01-21", users: 89 },
        ],
        projectsByCategory: [
          { category: "Web Development", count: 1245 },
          { category: "Data Science", count: 567 },
          { category: "AI/ML", count: 423 },
          { category: "Mobile Apps", count: 321 },
          { category: "IoT", count: 189 },
          { category: "Gaming", count: 111 },
        ],
        nodeTypeDistribution: [
          { type: "Input", count: 3200 },
          { type: "Process", count: 4500 },
          { type: "Output", count: 2800 },
          { type: "Decision", count: 1900 },
          { type: "API", count: 1400 },
          { type: "Database", count: 1100 },
          { type: "Custom", count: 947 },
        ],
        topFeatures: [
          { feature: "Node Creation", usage: 2847 },
          { feature: "Project Collaboration", usage: 1923 },
          { feature: "Template Usage", usage: 1456 },
          { feature: "Export/Import", usage: 1234 },
          { feature: "Real-time Sync", usage: 1098 },
          { feature: "Version Control", usage: 876 },
        ],
      },
      leaderboard: {
        topUsers: [
          {
            userId: "1",
            username: "alex_dev",
            totalProjects: 45,
            totalNodes: 567,
            totalConnections: 1234,
            lastActive: "2024-01-21T08:30:00Z",
          },
          {
            userId: "2",
            username: "sarah_designer",
            totalProjects: 38,
            totalNodes: 489,
            totalConnections: 1098,
            lastActive: "2024-01-21T09:15:00Z",
          },
          {
            userId: "3",
            username: "mike_data",
            totalProjects: 42,
            totalNodes: 456,
            totalConnections: 987,
            lastActive: "2024-01-21T07:45:00Z",
          },
          {
            userId: "4",
            username: "lisa_pm",
            totalProjects: 29,
            totalNodes: 378,
            totalConnections: 876,
            lastActive: "2024-01-21T10:20:00Z",
          },
          {
            userId: "5",
            username: "john_backend",
            totalProjects: 33,
            totalNodes: 345,
            totalConnections: 765,
            lastActive: "2024-01-21T09:00:00Z",
          },
        ],
        topProjects: [
          {
            projectId: "1",
            name: "E-commerce Platform",
            nodeCount: 156,
            connectionCount: 289,
            collaborators: 8,
            lastUpdated: "2024-01-21T10:30:00Z",
          },
          {
            projectId: "2",
            name: "ML Pipeline",
            nodeCount: 134,
            connectionCount: 267,
            collaborators: 6,
            lastUpdated: "2024-01-21T09:45:00Z",
          },
          {
            projectId: "3",
            name: "IoT Dashboard",
            nodeCount: 128,
            connectionCount: 234,
            collaborators: 5,
            lastUpdated: "2024-01-21T08:15:00Z",
          },
          {
            projectId: "4",
            name: "Social Media App",
            nodeCount: 145,
            connectionCount: 198,
            collaborators: 7,
            lastUpdated: "2024-01-21T11:00:00Z",
          },
          {
            projectId: "5",
            name: "Analytics Engine",
            nodeCount: 112,
            connectionCount: 187,
            collaborators: 4,
            lastUpdated: "2024-01-21T09:30:00Z",
          },
        ],
      },
    };

    res.json(platformMetrics);
  } catch (error) {
    console.error("Error fetching platform metrics:", error);
    res.status(500).json({ error: "Failed to fetch platform metrics" });
  }
});

export default router;
