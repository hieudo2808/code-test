import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Clock, Users, Trophy, Calendar, ArrowLeft, Loader2 } from "lucide-react";
import { contestService, type Contest, type ContestProblem } from "~/services/contestService";

export function ContestDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [contest, setContest] = useState<Contest | null>(null);
    const [problems, setProblems] = useState<ContestProblem[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (!id) return;
            try {
                setLoading(true);
                const [contestData, problemsData] = await Promise.all([
                    contestService.getContest(id),
                    contestService.getContestProblems(id),
                ]);
                setContest(contestData);
                setProblems(problemsData);
            } catch (error) {
                console.error("Error fetching contest:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const handleJoinContest = async () => {
        if (!id) return;
        try {
            setJoining(true);
            await contestService.joinContest(id);
            // Refresh contest data
            const contestData = await contestService.getContest(id);
            setContest(contestData);
        } catch (error) {
            console.error("Error joining contest:", error);
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getDuration = () => {
        const start = new Date(contest.startTime).getTime();
        const end = new Date(contest.endTime).getTime();
        const diff = end - start;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
    };

    const getContestStatusBadge = (state: Contest["state"]) => {
        const variants: Record<string, "info" | "success" | "default" | "warning"> = {
            UPCOMING: "info",
            RUNNING: "success",
            FROZEN: "warning",
            FINISHED: "default",
        };
        const labels: Record<string, string> = {
            UPCOMING: "SẮP DIỄN RA",
            RUNNING: "ĐANG DIỄN RA",
            FROZEN: "ĐÓNG BĂNG",
            FINISHED: "ĐÃ KẾT THÚC",
        };
        return <Badge variant={variants[state] || "default"}>{labels[state] || state}</Badge>;
    };

    const renderActionButton = () => {
        if (contest.isJoined) {
            if (contest.state === "RUNNING") {
                return (
                    <Button size="lg">
                        <Trophy className="w-4 h-4 mr-2" />
                        Tiếp tục thi
                    </Button>
                );
            }
            return (
                <Button size="lg" variant="secondary">
                    Xem kết quả
                </Button>
            );
        }

        if (contest.state === "UPCOMING" || contest.state === "RUNNING") {
            return (
                <Button size="lg" onClick={handleJoinContest} disabled={joining}>
                    {joining ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Trophy className="w-4 h-4 mr-2" />
                    )}
                    Đăng ký
                </Button>
            );
        }

        return null;
    };

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
                                {contest.contestName}
                            </h1>
                            {getContestStatusBadge(contest.state)}
                        </div>
                    </div>
                    {renderActionButton()}
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
                                    {contest.participantCount}
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
                                    Số bài tập
                                </p>
                                <p className="text-gray-900 dark:text-white font-medium">
                                    {contest.problemCount}
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
                                    Số lần nộp
                                </th>
                                <th className="px-6 py-3 text-right text-xs text-gray-500 dark:text-gray-400 uppercase">
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {problems.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                                    >
                                        Chưa có bài tập nào trong cuộc thi này.
                                    </td>
                                </tr>
                            ) : (
                                problems.map((problem, index) => (
                                    <tr
                                        key={problem.problemId}
                                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {String.fromCharCode(65 + index)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900 dark:text-white font-medium">
                                                {problem.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {problem.submissionCount} /{" "}
                                                {problem.maxSubmissions || "∞"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    navigate(
                                                        `/problems/${problem.slug}?contestId=${contest.contestId}`
                                                    )
                                                }
                                                disabled={
                                                    !contest.isJoined &&
                                                    contest.state !== "FINISHED"
                                                }
                                            >
                                                {contest.isJoined || contest.state === "FINISHED"
                                                    ? "Giải"
                                                    : "Đăng ký trước"}
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
    );
}
