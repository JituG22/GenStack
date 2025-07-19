import React, { useState, useEffect } from "react";
import {
  ChartBarIcon,
  ShieldCheckIcon,
  CodeBracketIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface RepositoryAnalyticsDashboardProps {
  accountId: string;
  repoName: string;
}

interface Metrics {
  overview: {
    totalCommits: number;
    totalContributors: number;
    totalBranches: number;
    totalPullRequests: number;
    totalIssues: number;
    codeQuality: {
      linesOfCode: number;
      technicalDebt: number;
      coverage: number;
    };
  };
  activity: {
    commitsPerDay: Array<{ date: string; commits: number }>;
    contributorActivity: Array<{
      author: string;
      commits: number;
      additions: number;
      deletions: number;
    }>;
  };
  performance: {
    buildTimes: Array<{ date: string; duration: number; status: string }>;
    failureRate: number;
    recoveryTime: number;
  };
}

interface SecurityAnalysis {
  vulnerabilities: Array<{
    id: string;
    severity: "critical" | "high" | "medium" | "low";
    type: string;
    description: string;
    status: "open" | "fixed" | "dismissed";
  }>;
  compliance: {
    score: number;
    checks: Array<{
      name: string;
      status: "pass" | "fail" | "warning";
      description: string;
    }>;
  };
}

const API_BASE_URL = "/api";

export const RepositoryAnalyticsDashboard: React.FC<
  RepositoryAnalyticsDashboardProps
> = ({ accountId, repoName }) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [security, setSecurity] = useState<SecurityAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d"
  );
  const [activeTab, setActiveTab] = useState<
    "overview" | "activity" | "performance" | "security"
  >("overview");

  useEffect(() => {
    loadAnalytics();
  }, [accountId, repoName, timeRange]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const [metricsResponse, securityResponse] = await Promise.all([
        fetch(
          `${API_BASE_URL}/repository-analytics/metrics/${repoName}?accountId=${accountId}&timeRange=${timeRange}`,
          {
            headers: getAuthHeaders(),
          }
        ),
        fetch(
          `${API_BASE_URL}/repository-analytics/security/${repoName}?accountId=${accountId}`,
          {
            headers: getAuthHeaders(),
          }
        ),
      ]);

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.data.metrics);
      }

      if (securityResponse.ok) {
        const securityData = await securityResponse.json();
        setSecurity(securityData.data.analysis);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSecurityColor = (severity: string) => {
    const colors = {
      critical: "text-red-600 bg-red-100",
      high: "text-orange-600 bg-orange-100",
      medium: "text-yellow-600 bg-yellow-100",
      low: "text-green-600 bg-green-100",
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case "fail":
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case "warning":
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ChartBarIcon className="w-8 h-8 mr-3 text-indigo-600" />
            Repository Analytics
          </h2>
          <p className="text-gray-600 mt-1">
            {repoName} - Advanced insights and metrics
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {["overview", "activity", "performance", "security"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Metric Cards */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <CodeBracketIcon className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Commits
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(metrics.overview.totalCommits)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Contributors
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.overview.totalContributors}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Pull Requests
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.overview.totalPullRequests}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <ShieldCheckIcon className="w-8 h-8 text-indigo-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Code Coverage
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.overview.codeQuality.coverage}%
                </p>
              </div>
            </div>
          </div>

          {/* Code Quality Card */}
          <div className="md:col-span-2 lg:col-span-4 bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Code Quality Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {formatNumber(metrics.overview.codeQuality.linesOfCode)}
                </p>
                <p className="text-sm text-gray-600">Lines of Code</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">
                  {metrics.overview.codeQuality.technicalDebt}
                </p>
                <p className="text-sm text-gray-600">Technical Debt</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {metrics.overview.codeQuality.coverage}%
                </p>
                <p className="text-sm text-gray-600">Test Coverage</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === "activity" && metrics && (
        <div className="space-y-6">
          {/* Contributor Activity */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Contributors
            </h3>
            <div className="space-y-3">
              {metrics.activity.contributorActivity
                .slice(0, 5)
                .map((contributor, index) => (
                  <div
                    key={contributor.author}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">
                          {contributor.author}
                        </p>
                        <p className="text-sm text-gray-600">
                          {contributor.commits} commits
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600">
                        +{formatNumber(contributor.additions)}
                      </p>
                      <p className="text-sm text-red-600">
                        -{formatNumber(contributor.deletions)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Commit Activity Chart Placeholder */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Commit Activity
            </h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chart visualization would go here</p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === "performance" && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Failure Rate</span>
                <span className="text-2xl font-bold text-red-600">
                  {metrics.performance.failureRate}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Recovery Time</span>
                <span className="text-2xl font-bold text-green-600">
                  {metrics.performance.recoveryTime}h
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Build Performance
            </h3>
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Build time trends would go here</p>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && security && (
        <div className="space-y-6">
          {/* Security Score */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Security Compliance
              </h3>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">
                  {security.compliance.score}/100
                </p>
                <p className="text-sm text-gray-600">Compliance Score</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${security.compliance.score}%` }}
              ></div>
            </div>
          </div>

          {/* Vulnerabilities */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Security Vulnerabilities
            </h3>
            {security.vulnerabilities.length > 0 ? (
              <div className="space-y-3">
                {security.vulnerabilities.slice(0, 5).map((vuln) => (
                  <div
                    key={vuln.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSecurityColor(
                          vuln.severity
                        )}`}
                      >
                        {vuln.severity.toUpperCase()}
                      </span>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{vuln.type}</p>
                        <p className="text-sm text-gray-600">
                          {vuln.description}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vuln.status === "fixed"
                          ? "bg-green-100 text-green-800"
                          : vuln.status === "open"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {vuln.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No vulnerabilities found
              </p>
            )}
          </div>

          {/* Compliance Checks */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Compliance Checks
            </h3>
            <div className="space-y-3">
              {security.compliance.checks.map((check, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center">
                    {getStatusIcon(check.status)}
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{check.name}</p>
                      <p className="text-sm text-gray-600">
                        {check.description}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      check.status === "pass"
                        ? "bg-green-100 text-green-800"
                        : check.status === "fail"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {check.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
