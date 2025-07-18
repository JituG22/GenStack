import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartProps {
  data: any[];
  type: "line" | "bar" | "pie" | "area";
  title?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
}

const DEFAULT_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#F97316",
  "#06B6D4",
  "#84CC16",
  "#EC4899",
  "#6B7280",
];

const AnalyticsChart: React.FC<ChartProps> = ({
  data,
  type,
  title,
  xAxisKey = "name",
  yAxisKey = "value",
  colors = DEFAULT_COLORS,
  height = 300,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
}) => {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    switch (type) {
      case "line":
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis tick={{ fontSize: 12 }} tickLine={{ stroke: "#E5E7EB" }} />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
            )}
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={yAxisKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
            />
          </LineChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis tick={{ fontSize: 12 }} tickLine={{ stroke: "#E5E7EB" }} />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
            )}
            {showLegend && <Legend />}
            <Bar dataKey={yAxisKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis tick={{ fontSize: 12 }} tickLine={{ stroke: "#E5E7EB" }} />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
            )}
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={yAxisKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart {...commonProps}>
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
            )}
            {showLegend && <Legend />}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              paddingAngle={2}
              dataKey={yAxisKey}
            >
              {data.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart() || <div>No data available</div>}
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;
