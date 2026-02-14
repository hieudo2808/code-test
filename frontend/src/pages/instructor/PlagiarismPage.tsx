import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Trophy, Users, Calendar, ChevronRight } from "lucide-react";
import { contestService, Contest } from "~/services/contestService";

export function PlagiarismPage() {
    const navigate = useNavigate();
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadContests();
    }, []);

    const loadContests = async () => {
        try {
            setLoading(true);
            const data = await contestService.getMyContests();
            setContests(data.content || []);
        } catch (err) {
            console.error("Failed to load contests:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStateBadge = (state: string) => {
        switch (state) {
            case "RUNNING":
                return (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Đang diễn ra
                    </span>
                );
            case "UPCOMING":
                return (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Sắp diễn ra
                    </span>
                );
            case "FINISHED":
                return (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        Đã kết thúc
                    </span>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Kiểm tra đạo văn
                    </h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400 ml-[52px]">
                    Chọn một cuộc thi để kiểm tra và xem kết quả đạo văn
                </p>
            </div>

            {/* Contest List */}
            {contests.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        Bạn chưa tạo cuộc thi nào
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                        Hãy tạo cuộc thi trước khi sử dụng tính năng kiểm tra đạo văn
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {contests.map((contest) => (
                        <div
                            key={contest.contestId}
                            onClick={() => navigate(`/instructor/plagiarism/${contest.contestId}`)}
                            className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 
                                       hover:border-red-300 dark:hover:border-red-700 hover:shadow-md 
                                       transition-all duration-200 cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                            {contest.contestName}
                                        </h3>
                                        {getStateBadge(contest.state)}
                                    </div>
                                    <div className="flex items-center gap-5 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4" />
                                            {contest.participantCount} thí sinh
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Trophy className="w-4 h-4" />
                                            {contest.problemCount} bài tập
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(contest.startTime).toLocaleDateString("vi-VN")}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
