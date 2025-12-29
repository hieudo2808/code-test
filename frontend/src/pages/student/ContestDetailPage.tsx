import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Clock, Users, Trophy, Calendar, ArrowLeft } from "lucide-react";
import { mockContests, mockProblems, type Contest } from "~/lib/mock-data";

export function ContestDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const contest = mockContests.find((c) => c.id === id);

    if (!contest) {
        return (
            <div className="text-center py-12">
                <h2 className="text-gray-900 dark:text-white text-xl mb-4">
                    Không tìm thấy cuộc thi
                </h2>
                <Button onClick={() => navigate("/")}>Về trang chủ</Button>
            </div>
        );
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("vi-VN", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getDuration = () => {
        const diff = contest.endTime.getTime() - contest.startTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        return `${hours} giờ`;
    };

    const getContestStatusBadge = (status: Contest["status"]) => {
        const variants = {
            upcoming: "info" as const,
            ongoing: "success" as const,
            finished: "default" as const,
        };
        const labels = {
            upcoming: "SẮP DIỄN RA",
            ongoing: "ĐANG DIỄN RA",
            finished: "ĐÃ KẾT THÚC",
        };

        return <Badge variant={variants[status]}>{labels[status]}</Badge>;
    };

    const totalScore = contest.problems.reduce((sum, p) => sum + p.score, 0);

    return (
        <div className="space-y-6">
            <div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Trở về trang chủ
                </Button>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-gray-900 dark:text-white text-2xl font-bold">
                                {contest.name}
                            </h1>
                            {getContestStatusBadge(contest.status)}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">{contest.description}</p>
                    </div>
                    {contest.status === "ongoing" ? (
                        <Button size="lg">
                            <Trophy className="w-4 h-4 mr-2" />
                            Tiếp tục thi
                        </Button>
                    ) : contest.status === "upcoming" ? (
                        <Button size="lg">
                            <Trophy className="w-4 h-4 mr-2" />
                            Đăng ký
                        </Button>
                    ) : (
                        <Button size="lg" variant="secondary">
                            Xem kết quả
                        </Button>
                    )}
                </div>
            </div>

            {/* Contest Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Thời gian bắt đầu
                                </p>
                                <p className="text-gray-900 dark:text-white font-medium">
                                    {formatDate(contest.startTime)}
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Thời lượng
                                </p>
                                <p className="text-gray-900 dark:text-white font-medium">
                                    {getDuration()}
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Số người tham gia
                                </p>
                                <p className="text-gray-900 dark:text-white font-medium">
                                    {contest.participants}
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Tổng điểm
                                </p>
                                <p className="text-gray-900 dark:text-white font-medium">
                                    {totalScore}
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Problems List */}
            <Card>
                <CardHeader>
                    <h3 className="text-gray-900 dark:text-white font-semibold">
                        Danh sách bài tập
                    </h3>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                    #
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                    Bài tập
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                    Điểm
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                    Đã giải
                                </th>
                                <th className="px-6 py-3 text-right text-xs text-gray-500 dark:text-gray-400 uppercase">
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {contest.problems.map((contestProblem, index) => {
                                const problem = mockProblems.find(
                                    (p) => p.id === contestProblem.problemId
                                );
                                if (!problem) return null;

                                return (
                                    <tr
                                        key={problem.id}
                                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {String.fromCharCode(65 + index)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-gray-900 dark:text-white font-medium">
                                                    {problem.title}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Time: {problem.timeLimit}ms | Memory:{" "}
                                                    {problem.memoryLimit}MB
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-900 dark:text-white">
                                                {contestProblem.score}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                -
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                size="sm"
                                                onClick={() => navigate(`/problems/${problem.id}`)}
                                            >
                                                Giải
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Leaderboard Preview */}
            {contest.status !== "upcoming" && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="text-gray-900 dark:text-white font-semibold">
                                Bảng xếp hạng
                            </h3>
                            <Button variant="ghost" size="sm">
                                Xem đầy đủ
                            </Button>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                        Hạng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                        Thí sinh
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                        Điểm
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                        Thời gian
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { rank: 1, name: "Alice Johnson", score: 750, time: "1:23:45" },
                                    { rank: 2, name: "Bob Smith", score: 650, time: "1:45:20" },
                                    { rank: 3, name: "Charlie Brown", score: 600, time: "1:52:10" },
                                ].map((entry) => (
                                    <tr
                                        key={entry.rank}
                                        className="border-b border-gray-200 dark:border-gray-700"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                #{entry.rank}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-900 dark:text-white">
                                                {entry.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-900 dark:text-white">
                                                {entry.score}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {entry.time}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
