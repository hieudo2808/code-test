import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "~/components/ui/card";
import { Trophy, Clock, Users, FileText, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "~/contexts/AuthContext";
import { statsService, type UserStats } from "~/services/statsService";

export function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const statsRes = await statsService.getMyStats();
                setStats(statsRes);
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    const acceptancePercent = stats ? Math.round(stats.acceptanceRate * 100) : 0;

    const quickActions = [
        {
            title: "Browse Contests",
            description: "Join contests and compete with others",
            icon: Trophy,
            color: "from-blue-500 to-blue-600",
            path: "/contests",
        },
        {
            title: "Practice Problems",
            description: "Solve problems to sharpen your skills",
            icon: FileText,
            color: "from-purple-500 to-purple-600",
            path: "/problems",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h1 className="text-(--text-primary) mb-1">
                    Welcome, {user?.name || "User"}!
                </h1>
                <p className="text-(--text-secondary)">
                    Practice problems and join contests to improve your skills.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-(--text-secondary) text-sm">Problems Solved</p>
                                <h2 className="text-(--text-primary) mt-1">{stats?.solvedProblems ?? 0}</h2>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
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
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    {stats?.acceptedCount ?? 0} accepted
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-(--text-secondary) text-sm">Contests Joined</p>
                                <h2 className="text-(--text-primary) mt-1">{stats?.contestsJoined ?? 0}</h2>
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
                                <p className="text-(--text-secondary) text-sm">Acceptance Rate</p>
                                <h2 className="text-(--text-primary) mt-1">{acceptancePercent}%</h2>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-(--text-primary) text-xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Card key={action.path}>
                                <CardBody>
                                    <div
                                        className="flex items-center gap-4 cursor-pointer group"
                                        onClick={() => navigate(action.path)}
                                    >
                                        <div
                                            className={`w-14 h-14 bg-linear-to-br ${action.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}
                                        >
                                            <Icon className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-(--text-primary) font-semibold group-hover:text-red-500 transition-colors">
                                                {action.title}
                                            </h3>
                                            <p className="text-(--text-secondary) text-sm mt-0.5">
                                                {action.description}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-(--text-secondary) group-hover:translate-x-1 transition-transform flex-shrink-0" />
                                    </div>
                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
