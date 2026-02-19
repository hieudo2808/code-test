import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Users, FileText, Trophy, TrendingUp, Loader2 } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import {
    statsService,
    type SystemStats,
    type SubmissionDayCount,
    type VerdictCount,
} from "~/services/statsService";

interface AdminDashboardProps {
    onNavigate: (page: string) => void;
}

const VERDICT_COLORS: Record<string, string> = {
    ACCEPTED: "#10b981",
    PARTIAL: "#3b82f6",
    FAILED: "#ef4444",
    COMPILE_ERROR: "#f97316",
    RUNTIME_ERROR: "#8b5cf6",
    TIME_LIMIT: "#f59e0b",
    MEMORY_LIMIT: "#ec4899",
    SCORED: "#06b6d4",
    MANUAL: "#6b7280",
};

const VERDICT_LABELS: Record<string, string> = {
    ACCEPTED: "Accepted",
    PARTIAL: "Partial",
    FAILED: "Wrong Answer",
    COMPILE_ERROR: "Compile Error",
    RUNTIME_ERROR: "Runtime Error",
    TIME_LIMIT: "Time Limit",
    MEMORY_LIMIT: "Memory Limit",
    SCORED: "Scored",
    MANUAL: "Manual",
};

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [weeklyData, setWeeklyData] = useState<SubmissionDayCount[]>([]);
    const [verdictData, setVerdictData] = useState<{ name: string; value: number; color: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);

                const [statsRes, weeklyRes, verdictRes] = await Promise.all([
                    statsService.getSystemStats(),
                    statsService.getWeeklySubmissions(),
                    statsService.getVerdictDistribution(),
                ]);

                setStats(statsRes);

                // Format weekly data — show day of week
                const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const formatted = weeklyRes.map((d: SubmissionDayCount) => {
                    const dateObj = new Date(d.date + "T00:00:00");
                    return {
                        date: dayNames[dateObj.getDay()],
                        count: d.count,
                    };
                });
                setWeeklyData(formatted);

                // Format verdict data
                const pieData = verdictRes.map((v: VerdictCount) => ({
                    name: VERDICT_LABELS[v.verdict] || v.verdict,
                    value: v.count,
                    color: VERDICT_COLORS[v.verdict] || "#6b7280",
                }));
                setVerdictData(pieData);
            } catch (err) {
                console.error("Error fetching admin stats:", err);
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <span className="ml-2 text-(--text-secondary)">Loading dashboard...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    const tooltipStyle = {
        backgroundColor: "var(--bg-app)",
        border: "1px solid var(--border-color)",
        borderRadius: "0.5rem",
        fontSize: "0.875rem",
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-(--text-primary) mb-1">Admin Dashboard</h1>
                    <p className="text-(--text-secondary)">
                        Monitor system performance and manage users.
                    </p>
                </div>
                <Button onClick={() => onNavigate("user-management")}>Manage Users</Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-(--text-secondary) text-sm">Total Users</p>
                                <h2 className="text-(--text-primary) mt-1">{stats?.totalUsers ?? 0}</h2>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    {stats?.activeUsers ?? 0} active
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-(--text-secondary) text-sm">Total Problems</p>
                                <h2 className="text-(--text-primary) mt-1">{stats?.totalProblems ?? 0}</h2>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    {stats?.publicProblems ?? 0} public
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-(--text-secondary) text-sm">Contests</p>
                                <h2 className="text-(--text-primary) mt-1">{stats?.totalContests ?? 0}</h2>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    {stats?.activeContests ?? 0} active
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-(--text-secondary) text-sm">Total Submissions</p>
                                <h2 className="text-(--text-primary) mt-1">{stats?.totalSubmissions ?? 0}</h2>
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                    {stats?.pendingSubmissions ?? 0} pending
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Submissions */}
                <Card>
                    <CardHeader>
                        <h3 className="text-(--text-primary)">Submissions This Week</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                                        axisLine={{ stroke: "var(--border-color)" }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                                        axisLine={{ stroke: "var(--border-color)" }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="count" name="Submissions" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardBody>
                </Card>

                {/* Verdict Distribution */}
                <Card>
                    <CardHeader>
                        <h3 className="text-(--text-primary)">Verdict Distribution</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="h-72">
                            {verdictData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={verdictData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) =>
                                                percent > 0.05
                                                    ? `${name} ${(percent * 100).toFixed(0)}%`
                                                    : ""
                                            }
                                            outerRadius={90}
                                            innerRadius={40}
                                            fill="#8884d8"
                                            dataKey="value"
                                            paddingAngle={2}
                                        >
                                            {verdictData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Legend
                                            wrapperStyle={{ fontSize: "12px" }}
                                            formatter={(value: string) => (
                                                <span className="text-(--text-secondary)">{value}</span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-(--text-secondary) text-sm">
                                    No submission data available
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
