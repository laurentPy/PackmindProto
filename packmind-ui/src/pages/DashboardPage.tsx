// src/pages/DashboardPage.tsx
import {
  BarChart,
  Bar,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as LineTooltip,
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
  ResponsiveContainer as PieContainer,
} from "recharts";

import { dashboardData } from "../data/dashboardData";


export function DashboardPage() {
  return (
    <div className="p-6 space-y-12">
      <h1 className="text-2xl font-bold">Packmind Dashboard</h1>

      {/* Section A: Team-Level Violations */}

        <section>
        <h2 className="text-xl font-semibold mb-4">Team-Level Violations</h2>
        <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
            <BarChart
                data={dashboardData.services}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="errors" stackId="a" fill="#E53E3E" name="Errors" />
                <Bar
                dataKey="warnings"
                stackId="a"
                fill="#DD6B20"
                name="Warnings"
                />
                <Bar dataKey="infos" stackId="a" fill="#3182CE" name="Infos" />
            </BarChart>
            </ResponsiveContainer>
        </div>
        {/* ─── Burn-down: Open vs Closed ─── */}
        <div className="mt-8" style={{ width: "100%", height: 250 }}>
        <ResponsiveContainer>
            <LineChart
            data={dashboardData.burnDown}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis />
            <LineTooltip />
            <Legend verticalAlign="top" height={36} />
            <Line
                type="monotone"
                dataKey="open"
                stroke="#E53E3E"
                name="Open Violations"
                dot={false}
            />
            <Line
                type="monotone"
                dataKey="closed"
                stroke="#38A169"
                name="Closed Violations"
                dot={false}
            />
            </LineChart>
        </ResponsiveContainer>
        </div>

        </section>

      {/* (Other sections…) */}
        <section>
        <h2 className="text-xl font-semibold mb-4">Rule Adoption & Coverage</h2>

        <div className="flex flex-col md:flex-row gap-8">
            {/* Donut */}
            <div className="flex-1" style={{ height: 250 }}>
            <PieContainer>
                <PieChart>
                <Pie
                    data={[
                    { name: "Enforced",   value: dashboardData.coverage.enforcedAdrs },
                    { name: "Unenforced", value: dashboardData.coverage.totalAdrs - dashboardData.coverage.enforcedAdrs }
                    ]}
                    innerRadius={60}
                    outerRadius={90}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    paddingAngle={2}
                >
                    <Cell fill="#38A169" />  {/* green */}
                    <Cell fill="#A0AEC0" />  {/* gray */}
                </Pie>
                <PieTooltip />
                </PieChart>
            </PieContainer>
            <div className="text-center mt-2 text-lg">
                {((dashboardData.coverage.enforcedAdrs / dashboardData.coverage.totalAdrs) * 100).toFixed(0)}% ADRs Enforced
            </div>
            </div>

            {/* Unenforced List */}
            <div className="flex-1">
            <h3 className="font-medium mb-2">Unenforced ADRs</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
                {dashboardData.coverage.unenforcedList.map((adr) => (
                <li key={adr}>{adr}</li>
                ))}
            </ul>
            </div>
        </div>
        </section>

        {/* Section C: Compliance Score */}
        <section>
        <h2 className="text-xl font-semibold mb-4">Overall Compliance Score</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* KPI Tile */}
            <div className="flex flex-col items-center justify-center bg-white p-6 rounded-lg shadow">
            <div className="text-4xl font-bold">
                {(
                (dashboardData.coverage.enforcedAdrs /
                    dashboardData.coverage.totalAdrs) *
                100
                ).toFixed(0)}
                %
            </div>
            <div className="text-gray-600 mt-1">ADRs Enforced</div>
            <div className="text-sm text-gray-500 mt-2">
                {dashboardData.coverage.enforcedAdrs} of{" "}
                {dashboardData.coverage.totalAdrs}
            </div>
            </div>

            {/* Sparkline of high‐severity violations */}
            <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-700 mb-2">High-Severity Violations (trend)</div>
            <div style={{ width: "100%", height: 100 }}>
                <ResponsiveContainer>
                <LineChart data={dashboardData.highSeverityTrend}>
                    <XAxis dataKey="week" hide />
                    <Line
                    type="monotone"
                    dataKey="highSeverityCount"
                    stroke="#E53E3E"
                    dot={false}
                    strokeWidth={2}
                    />
                    <LineTooltip
                    formatter={(value: number) => [`${value}`, "High Sev"]}
                    labelFormatter={(week: string) => `Week of ${week}`}
                    />
                </LineChart>
                </ResponsiveContainer>
            </div>
            </div>
        </div>
        </section>

        {/* Section D: Adoption & Growth */}
        <section>
            <h2 className="text-xl font-semibold mb-4">Adoption & Growth</h2>
            <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
                <BarChart
                data={dashboardData.quarterlyAdrs}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="created" name="ADRs Created" fill="#3182CE" />
                <Bar dataKey="updated" name="ADRs Updated" fill="#4A5568" />
                </BarChart>
            </ResponsiveContainer>
            </div>
        </section>


    </div>
  );
}
