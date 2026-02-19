import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "~/components/ui/card";
import {
    FileText, Trophy, Users, TrendingUp, Plus, ShieldAlert, ClipboardList, Loader2, ArrowRight,
} from "lucide-react";
import { statsService, type InstructorStats } from "~/services/statsService";
import { contestService, type Contest } from "~/services/contestService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface InstructorDashboardProps {
    onNavigate: (page: string, id?: string) => void;
}

interface ContestChartItem {
    name: string;
    participants: number;
}

export function InstructorDashboard({ onNavigate }: InstructorDashboardProps) {
    const [stats, setStats] = useState<InstructorStats | null>(null);
    const [contestData, setContestData] = useState<ContestChartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                setError(null);

                const [statsRes, contestsRes] = await Promise.all([
                    statsService.getInstructorStats(),
                    contestService.getMyContests(0, 10),
                ]);

                setStats(statsRes);

                const chartData: ContestChartItem[] = contestsRes.content
                    .slice(0, 8)
                    .map((c: Contest) => ({
                        name: c.contestName.length > 15 ? c.contestName.slice(0, 15) + "…" : c.contestName,
                        participants: c.participantCount,
                    }));
                setContestData(chartData);
            } catch (err) {
                console.error("Error fetching instructor stats:", err);
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

    const quickActions = [
        {
            title: "Create Problem",
            description: "Add a new coding problem with test cases",
            icon: Plus,
            color: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
            action: () => onNavigate("create-problem"),
        },
        {
            title: "Create Contest",
            description: "Set up a new programming contest",
            icon: Trophy,
            color: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400",
            action: () => onNavigate("create-contest"),
        },
        {
            title: "Plagiarism Check",
            description: "Detect code similarity across submissions",
            icon: ShieldAlert,
            color: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400",
            action: () => onNavigate("plagiarism"),
        },
        {
            title: "Manage Problems",
            description: "View and edit your existing problems",
            icon: ClipboardList,
            color: "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400",
            action: () => onNavigate("problems"),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-(--text-primary) mb-1">Instructor Dashboard</h1>
                <p className="text-(--text-secondary)">
                    Manage your problems, contests, and track student performance.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-(--text-secondary) text-sm">Total Problems</p>
                                <h2 className="text-(--text-primary) mt-1">{stats?.totalProblems ?? 0}</h2>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-(--text-secondary) text-sm">Total Contests</p>
                                <h2 className="text-(--text-primary) mt-1">{stats?.totalContests ?? 0}</h2>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-(--text-secondary) text-sm">Total Participants</p>
                                <h2 className="text-(--text-primary) mt-1">{stats?.totalParticipants ?? 0}</h2>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-(--text-secondary) text-sm">Avg Acceptance</p>
                                <h2 className="text-(--text-primary) mt-1">{stats?.avgAcceptanceRate ?? 0}%</h2>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-(--text-primary) mb-3">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Card key={action.title}>
                                <button
                                    onClick={action.action}
                                    className="w-full p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors group"
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${action.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-(--text-primary) font-semibold text-sm mb-1 group-hover:text-red-500 transition-colors">
                                        {action.title}
                                    </h4>
                                    <p className="text-(--text-secondary) text-xs leading-relaxed">
                                        {action.description}
                                    </p>
                                    <ArrowRight className="w-4 h-4 text-gray-400 mt-2 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                                </button>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Contest Participants Chart */}
            {contestData.length > 0 && (
                <Card>
                    <CardHeader>
                        <h3 className="text-(--text-primary)">Participants per Contest</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={contestData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                                        axisLine={{ stroke: "var(--border-color)" }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                                        axisLine={{ stroke: "var(--border-color)" }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "var(--bg-app)",
                                            border: "1px solid var(--border-color)",
                                            borderRadius: "0.5rem",
                                            fontSize: "0.875rem",
                                        }}
                                    />
                                    <Bar dataKey="participants" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
}
