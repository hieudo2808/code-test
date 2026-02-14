import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ShieldAlert,
    Play,
    Loader2,
    AlertTriangle,
    Filter,
    ChevronRight,
} from "lucide-react";
import { plagiarismService, PlagiarismResult } from "~/services/plagiarismService";
import { contestService, Contest, ContestProblem } from "~/services/contestService";

export function PlagiarismResultsPage() {
    const { contestId } = useParams<{ contestId: string }>();
    const navigate = useNavigate();

    const [contest, setContest] = useState<Contest | null>(null);
    const [problems, setProblems] = useState<ContestProblem[]>([]);
    const [results, setResults] = useState<PlagiarismResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [selectedProblem, setSelectedProblem] = useState<string>("all");

    useEffect(() => {
        if (contestId) loadData();
    }, [contestId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [contestData, problemsData, resultsData] = await Promise.all([
                contestService.getContest(contestId!),
                contestService.getContestProblems(contestId!),
                plagiarismService.getResults(contestId!),
            ]);
            setContest(contestData);
            setProblems(problemsData);
            setResults(resultsData);
        } catch (err) {
            console.error("Failed to load plagiarism data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleTriggerCheck = async () => {
        try {
            setChecking(true);
            await plagiarismService.triggerCheck(contestId!);
            // Poll for results after a short delay (async check)
            setTimeout(async () => {
                try {
                    const resultsData = await plagiarismService.getResults(contestId!);
                    setResults(resultsData);
                } catch {
                    // ignore
                } finally {
                    setChecking(false);
                }
            }, 5000);
        } catch (err) {
            console.error("Failed to trigger check:", err);
            setChecking(false);
        }
    };

    const handleFilterByProblem = async (problemId: string) => {
        setSelectedProblem(problemId);
        try {
            if (problemId === "all") {
                const data = await plagiarismService.getResults(contestId!);
                setResults(data);
            } else {
                const data = await plagiarismService.getResultsByProblem(contestId!, problemId);
                setResults(data);
            }
        } catch (err) {
            console.error("Failed to filter results:", err);
        }
    };

    const getSimilarityColor = (similarity: number) => {
        const pct = similarity * 100;
        if (pct >= 90) return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
        if (pct >= 75) return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20";
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
    };

    const getSimilarityBarColor = (similarity: number) => {
        const pct = similarity * 100;
        if (pct >= 90) return "bg-red-500";
        if (pct >= 75) return "bg-orange-500";
        return "bg-yellow-500";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate("/instructor/plagiarism")}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại danh sách cuộc thi
                </button>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Kiểm tra đạo văn
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    {contest?.contestName}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleTriggerCheck}
                        disabled={checking}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 
                                   text-white font-semibold rounded-xl transition-colors shadow-md"
                    >
                        {checking ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang kiểm tra...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Chạy kiểm tra
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Filter by Problem */}
            {problems.length > 0 && (
                <div className="mb-6 flex items-center gap-3">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Lọc theo bài:</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleFilterByProblem("all")}
                            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                                selectedProblem === "all"
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                        >
                            Tất cả
                        </button>
                        {problems.map((p) => (
                            <button
                                key={p.problemId}
                                onClick={() => handleFilterByProblem(p.problemId)}
                                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                                    selectedProblem === p.problemId
                                        ? "bg-red-500 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                            >
                                {p.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results */}
            {results.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <ShieldAlert className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        {checking
                            ? "Đang chạy kiểm tra đạo văn..."
                            : "Chưa có kết quả kiểm tra đạo văn"}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                        {checking
                            ? "Vui lòng đợi trong giây lát"
                            : 'Bấm "Chạy kiểm tra" để bắt đầu phân tích'}
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <div className="col-span-3">Bài tập</div>
                        <div className="col-span-3">Sinh viên 1</div>
                        <div className="col-span-3">Sinh viên 2</div>
                        <div className="col-span-2">Độ trùng lặp</div>
                        <div className="col-span-1"></div>
                    </div>

                    {/* Table Body */}
                    {results.map((result) => (
                        <div
                            key={result.checkId}
                            onClick={() =>
                                navigate(
                                    `/instructor/plagiarism/${contestId}/${result.checkId}`
                                )
                            }
                            className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 
                                       hover:bg-red-50/50 dark:hover:bg-red-900/10 cursor-pointer transition-colors group"
                        >
                            <div className="col-span-3 flex items-center">
                                <span className="font-medium text-gray-900 dark:text-white truncate">
                                    {result.problemTitle}
                                </span>
                            </div>
                            <div className="col-span-3 flex items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">
                                        {result.user1Name?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                        {result.user1Name}
                                    </span>
                                </div>
                            </div>
                            <div className="col-span-3 flex items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs font-bold">
                                        {result.user2Name?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                        {result.user2Name}
                                    </span>
                                </div>
                            </div>
                            <div className="col-span-2 flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span
                                            className={`text-sm font-bold px-2 py-0.5 rounded-md ${getSimilarityColor(result.similarity)}`}
                                        >
                                            {(result.similarity * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full ${getSimilarityBarColor(result.similarity)}`}
                                            style={{ width: `${result.similarity * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-1 flex items-center justify-end">
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                            </div>
                        </div>
                    ))}

                    {/* Summary */}
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Tìm thấy <strong className="text-gray-900 dark:text-white">{results.length}</strong> cặp bài nộp có nghi ngờ đạo văn
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
