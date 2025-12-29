import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge, DifficultyBadge } from "~/components/ui/Badge";
import { Trophy, Clock, Users, ChevronRight } from "lucide-react";
import { mockProblems, mockContests, type Contest } from "~/lib/mock-data";
import { useAuth } from "~/contexts/AuthContext";

export function HomePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const filteredContests = mockContests.filter((contest) => {
        if (statusFilter === "all") return true;
        return contest.status === statusFilter;
    });

    const filteredProblems = mockProblems.filter((problem) => {
        if (difficultyFilter === "all") return true;
        return problem.difficulty === difficultyFilter;
    });

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getContestStatusBadge = (status: Contest["status"]) => {
        const variants = {
            upcoming: "info" as const,
            ongoing: "success" as const,
            finished: "default" as const,
        };

        return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
    };

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
                                    {user?.solvedProblems || 0}
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
                                    {user?.totalSubmissions || 0}
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
                                    8
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
                            <option value="upcoming">Sắp diễn ra</option>
                            <option value="ongoing">Đang diễn ra</option>
                            <option value="finished">Đã kết thúc</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredContests.map((contest) => (
                        <Card key={contest.id} hover={true}>
                            <CardBody>
                                <div
                                    className="flex items-start justify-between gap-6 cursor-pointer"
                                    onClick={() => navigate(`/contests/${contest.id}`)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-gray-900 dark:text-white font-semibold">
                                                {contest.name}
                                            </h3>
                                            {getContestStatusBadge(contest.status)}
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
                                            {contest.description}
                                        </p>
                                        <div className="flex items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                <span>{formatDate(contest.startTime)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                <span>{contest.participants} người tham gia</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Trophy className="w-4 h-4" />
                                                <span>{contest.problems.length} bài tập</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-gray-500 shrink-0" />
                                </div>
                            </CardBody>
                        </Card>
                    ))}
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
                            <option value="Easy">Dễ</option>
                            <option value="Medium">Trung bình</option>
                            <option value="Hard">Khó</option>
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
                                        Tỷ lệ AC
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold tracking-wider">
                                        Số bài nộp
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold tracking-wider">
                                        Hành động
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProblems.map((problem) => (
                                    <tr
                                        key={problem.id}
                                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
                                        onClick={() => navigate(`/problems/${problem.id}`)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900 dark:text-white font-medium group-hover:text-red-600 transition-colors">
                                                {problem.title}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <DifficultyBadge difficulty={problem.difficulty} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                                                {problem.acceptanceRate}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                                                {problem.totalSubmissions}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button size="sm" variant="primary">
                                                Giải
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
