import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert, User, Clock, Code2 } from "lucide-react";
import { plagiarismService, PlagiarismResult } from "~/services/plagiarismService";
import { submissionService, Submission } from "~/services/submissionService";
import { languageService, Language } from "~/services/languageService";
import { CodeEditor } from "~/components/ui/CodeEditor";

export function PlagiarismDetailPage() {
    const { contestId, checkId } = useParams<{ contestId: string; checkId: string }>();
    const navigate = useNavigate();

    const [result, setResult] = useState<PlagiarismResult | null>(null);
    const [submission1, setSubmission1] = useState<Submission | null>(null);
    const [submission2, setSubmission2] = useState<Submission | null>(null);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (contestId && checkId) loadData();
    }, [contestId, checkId]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Load all plagiarism results and find the one matching checkId
            const [allResults, langs] = await Promise.all([
                plagiarismService.getResults(contestId!),
                languageService.getLanguages(),
            ]);
            setLanguages(langs);

            const found = allResults.find((r) => r.checkId === checkId);
            if (!found) return;
            setResult(found);

            // Load both submissions
            const [sub1, sub2] = await Promise.all([
                submissionService.getSubmission(found.submission1Id),
                submissionService.getSubmission(found.submission2Id),
            ]);
            setSubmission1(sub1);
            setSubmission2(sub2);
        } catch (err) {
            console.error("Failed to load plagiarism detail:", err);
        } finally {
            setLoading(false);
        }
    };

    const getLanguageName = (langId: number) => {
        return languages.find((l) => l.id === langId)?.name || `Language ${langId}`;
    };

    const getMonacoLanguage = (langId: number) => {
        return languages.find((l) => l.id === langId)?.monacoLanguage || "plaintext";
    };

    const getSimilarityColor = (similarity: number) => {
        const pct = similarity * 100;
        if (pct >= 90) return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
        if (pct >= 75) return "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30";
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
            </div>
        );
    }

    if (!result) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-500 dark:text-gray-400">Không tìm thấy kết quả</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(`/instructor/plagiarism/${contestId}`)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại kết quả kiểm tra
                </button>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                Chi tiết đạo văn — {result.problemTitle}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                                <Clock className="w-3.5 h-3.5" />
                                Kiểm tra lúc{" "}
                                {new Date(result.checkedAt).toLocaleString("vi-VN")}
                            </p>
                        </div>
                    </div>

                    {/* Similarity Badge */}
                    <div
                        className={`px-5 py-3 rounded-2xl font-bold text-2xl ${getSimilarityColor(result.similarity)}`}
                    >
                        {(result.similarity * 100).toFixed(1)}%
                        <span className="text-sm font-medium ml-1 opacity-75">trùng lặp</span>
                    </div>
                </div>
            </div>

            {/* Side-by-Side Comparison */}
            <div className="grid grid-cols-2 gap-4">
                {/* Submission 1 */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Student Info Header */}
                    <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                                {result.user1Name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-500" />
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {result.user1Name}
                                    </span>
                                </div>
                                {submission1 && (
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Code2 className="w-3 h-3" />
                                            {getLanguageName(submission1.languageId)}
                                        </span>
                                        <span>
                                            {new Date(submission1.submittedAt).toLocaleString("vi-VN")}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Code Editor */}
                    <div>
                        <CodeEditor
                            value={submission1?.sourceCode || "// Không có mã nguồn"}
                            onChange={() => {}}
                            language={
                                submission1
                                    ? getMonacoLanguage(submission1.languageId)
                                    : "plaintext"
                            }
                            readOnly={true}
                            height="600px"
                        />
                    </div>
                </div>

                {/* Submission 2 */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Student Info Header */}
                    <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-purple-50/50 dark:bg-purple-900/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-lg">
                                {result.user2Name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-purple-500" />
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {result.user2Name}
                                    </span>
                                </div>
                                {submission2 && (
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Code2 className="w-3 h-3" />
                                            {getLanguageName(submission2.languageId)}
                                        </span>
                                        <span>
                                            {new Date(submission2.submittedAt).toLocaleString("vi-VN")}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Code Editor */}
                    <div>
                        <CodeEditor
                            value={submission2?.sourceCode || "// Không có mã nguồn"}
                            onChange={() => {}}
                            language={
                                submission2
                                    ? getMonacoLanguage(submission2.languageId)
                                    : "plaintext"
                            }
                            readOnly={true}
                            height="600px"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
