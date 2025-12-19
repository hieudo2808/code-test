import React from "react";
import { Card, CardHeader, CardBody } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Users, FileText, Trophy, TrendingUp } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts";

interface AdminDashboardProps {
    onNavigate: (page: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
    const submissionsData = [
        { date: "Mon", submissions: 45 },
        { date: "Tue", submissions: 52 },
        { date: "Wed", submissions: 48 },
        { date: "Thu", submissions: 61 },
        { date: "Fri", submissions: 55 },
        { date: "Sat", submissions: 67 },
        { date: "Sun", submissions: 43 },
    ];

    const acceptanceData = [
        { month: "Jan", rate: 42 },
        { month: "Feb", rate: 45 },
        { month: "Mar", rate: 48 },
        { month: "Apr", rate: 47 },
        { month: "May", rate: 51 },
        { month: "Jun", rate: 53 },
    ];

    const statusDistribution = [
        { name: "Accepted", value: 453, color: "#10b981" },
        { name: "Wrong Answer", value: 287, color: "#ef4444" },
        { name: "TLE", value: 156, color: "#f59e0b" },
        { name: "Runtime Error", value: 89, color: "#8b5cf6" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-(--text-primary) mb-2">Admin Dashboard</h1>
                    <p className="text-(--text-secondary)">
                        Monitor system performance and manage users.
                    </p>
                </div>
                <Button onClick={() => onNavigate("user-management")}>Manage Users</Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-(--text-tertiary) text-sm">Total Users</p>
                                <h2 className="text-(--text-primary) mt-1">1,234</h2>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    +12% this month
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-(--text-tertiary) text-sm">
                                    Total Problems
                                </p>
                                <h2 className="text-(--text-primary) mt-1">456</h2>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    +8 this week
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-(--text-tertiary) text-sm">
                                    Active Contests
                                </p>
                                <h2 className="text-(--text-primary) mt-1">12</h2>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    3 ongoing
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-(--text-tertiary) text-sm">
                                    Submissions Today
                                </p>
                                <h2 className="text-(--text-primary) mt-1">342</h2>
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                    Peak: 11:00 AM
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Submissions Chart */}
                <Card>
                    <CardHeader>
                        <h3 className="text-(--text-primary)">Submissions This Week</h3>
                    </CardHeader>
                    <CardBody>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={submissionsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="date" stroke="var(--text-tertiary)" />
                                <YAxis stroke="var(--text-tertiary)" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--bg-primary)",
                                        border: "1px solid var(--border-color)",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Bar
                                    dataKey="submissions"
                                    fill="var(--primary-600)"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>

                {/* Acceptance Rate Chart */}
                <Card>
                    <CardHeader>
                        <h3 className="text-(--text-primary)">Acceptance Rate Trend</h3>
                    </CardHeader>
                    <CardBody>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={acceptanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="month" stroke="var(--text-tertiary)" />
                                <YAxis stroke="var(--text-tertiary)" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--bg-primary)",
                                        border: "1px solid var(--border-color)",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="rate"
                                    stroke="var(--primary-600)"
                                    strokeWidth={2}
                                    dot={{ fill: "var(--primary-600)", r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardBody>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <Card>
                    <CardHeader>
                        <h3 className="text-(--text-primary)">
                            Submission Status Distribution
                        </h3>
                    </CardHeader>
                    <CardBody>
                        <div className="flex items-center justify-center">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) =>
                                            `${name} ${(percent * 100).toFixed(0)}%`
                                        }
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "var(--bg-primary)",
                                            border: "1px solid var(--border-color)",
                                            borderRadius: "8px",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
