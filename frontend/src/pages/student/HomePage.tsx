import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge, DifficultyBadge } from "~/components/ui/badge";
import { Trophy, Clock, Users, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "~/contexts/AuthContext";
import { contestService, type Contest } from "~/services/contestService";
import { problemService, type ProblemListItem } from "~/services/problemService";
import { statsService, type UserStats } from "~/services/statsService";

export function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("RUNNING");

    // Data states
    const [contests, setContests] = useState<Contest[]>([]);
    const [problems, setProblems] = useState<ProblemListItem[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [contestsRes, problemsRes, statsRes] = await Promise.all([
                    contestService.getContests(),
                    problemService.getProblems(),
                    statsService.getMyStats(),
                ]);
                setContests(contestsRes.content || []);
                setProblems(problemsRes.content || []);
                setStats(statsRes);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const filteredContests = contests.filter((contest) => {
        if (statusFilter === "all") return true;
        return contest.state === statusFilter.toUpperCase();
    });

    const filteredProblems = problems.filter((problem) => {
        if (difficultyFilter === "all") return true;
        return problem.difficulty === difficultyFilter.toUpperCase();
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getContestStatusBadge = (state: Contest["state"]) => {
        const variants: Record<string, "info" | "success" | "default" | "warning"> = {
            UPCOMING: "info",
            RUNNING: "success",
            FROZEN: "warning",
            FINISHED: "default",
        };
        return <Badge variant={variants[state] || "default"}>{state}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="animate-fade-in">
                <h1 className="text-gray-900 dark:text-white mb-2">
                    Chào mừng, {user?.name || "User"}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Luyện tập bài tập và tham gia các cuộc thi để nâng cao kỹ năng của bạn.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card hover={true}>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wide">
                                    Bài đã giải
                                </p>
                                <h2 className="text-gray-900 dark:text-white mt-2 text-3xl font-bold">
                                    {stats?.solvedProblems || 0}
                                </h2>
                            </div>
                            <div className="w-14 h-14 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Trophy className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card hover={true}>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wide">
                                    Tổng bài nộp
                                </p>
                                <h2 className="text-gray-900 dark:text-white mt-2 text-3xl font-bold">
                                    {stats?.totalSubmissions || 0}
                                </h2>
                            </div>
                            <div className="w-14 h-14 bg-linear-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card hover={true}>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wide">
                                    Cuộc thi đã tham gia
                                </p>
                                <h2 className="text-gray-900 dark:text-white mt-2 text-3xl font-bold">
                                    {stats?.contestsJoined || 0}
                                </h2>
                            </div>
                            <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Active Contests */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-gray-900 dark:text-white text-xl font-bold">
                        Cuộc thi đang diễn ra
                    </h2>
                    <div className="flex items-center gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium shadow-sm hover:border-gray-400 transition-all cursor-pointer"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="UPCOMING">Sắp diễn ra</option>
                            <option value="RUNNING">Đang diễn ra</option>
                            <option value="FINISHED">Đã kết thúc</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredContests.length === 0 ? (
                        <Card>
                            <CardBody>
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                    Không có cuộc thi nào.
                                </p>
                            </CardBody>
                        </Card>
                    ) : (
                        filteredContests.map((contest) => (
                            <Card key={contest.contestId} hover={true}>
                                <CardBody>
                                    <div
                                        className="flex items-start justify-between gap-6 cursor-pointer"
                                        onClick={() => navigate(`/contests/${contest.contestId}`)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h3 className="text-gray-900 dark:text-white font-semibold">
                                                    {contest.contestName}
                                                </h3>
                                                {getContestStatusBadge(contest.state)}
                                            </div>
                                            <div className="flex items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{formatDate(contest.startTime)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    <span>
                                                        {contest.participantCount} người tham gia
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Trophy className="w-4 h-4" />
                                                    <span>{contest.problemCount} bài tập</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-6 h-6 text-gray-500 shrink-0" />
                                    </div>
                                </CardBody>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Practice Problems */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-gray-900 dark:text-white text-xl font-bold">
                        Bài tập luyện tập
                    </h2>
                    <div className="flex items-center gap-2">
                        <select
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium shadow-sm hover:border-gray-400 transition-all cursor-pointer"
                        >
                            <option value="all">Tất cả độ khó</option>
                            <option value="EASY">Dễ</option>
                            <option value="MEDIUM">Trung bình</option>
                            <option value="HARD">Khó</option>
                        </select>
                    </div>
                </div>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                    <th className="px-4 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold tracking-wider">
                                        Tiêu đề
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold tracking-wider">
                                        Độ khó
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold tracking-wider">
                                        Điểm tối đa
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold tracking-wider">
                                        Hành động
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProblems.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                                        >
                                            Không có bài tập nào.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProblems.map((problem) => (
                                        <tr
                                            key={problem.problemId}
                                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
                                            onClick={() =>
                                                navigate(`/problems/${problem.problemId}`)
                                            }
                                        >
                                            <td className="px-4 py-3">
                                                <div className="text-gray-900 dark:text-white font-medium group-hover:text-red-600 transition-colors">
                                                    {problem.title}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <DifficultyBadge
                                                    difficulty={
                                                        problem.difficulty as
                                                            | "EASY"
                                                            | "MEDIUM"
                                                            | "HARD"
                                                    }
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-gray-600 dark:text-gray-400 font-medium">
                                                    {problem.maxScore}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button size="sm" variant="primary">
                                                    Giải
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
