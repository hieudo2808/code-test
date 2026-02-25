import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardBody } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { DifficultyBadge, StatusBadge } from "~/components/ui/badge";
import { CodeEditor } from "~/components/ui/CodeEditor";
import { Select } from "~/components/ui/input";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "~/components/ui/table";
import {
    ArrowLeft,
    Clock,
    Database,
    Send,
    Loader2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Upload,
} from "lucide-react";
import { problemService, type Problem } from "~/services/problemService";
import { languageService, type Language } from "~/services/languageService";
import { submissionService, type Submission } from "~/services/submissionService";

type SubmissionStatus = "PENDING" | "JUDGING" | "DONE" | "ERROR" | "NEED_REVIEW";

export function ProblemDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const contestId = searchParams.get("contestId");

    const [problem, setProblem] = useState<Problem | null>(null);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);

    const [code, setCode] = useState("");
    const [languageId, setLanguageId] = useState<number>(0);
    const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // File upload states
    const [fileLanguageId, setFileLanguageId] = useState<number>(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Submissions list states
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [submissionsPage, setSubmissionsPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (!slug) return;
            try {
                setLoading(true);
                const [problemData, languagesData] = await Promise.all([
                    problemService.getProblemBySlug(slug),
                    languageService.getLanguages(),
                ]);
                setProblem(problemData);
                setLanguages(languagesData);
                if (languagesData.length > 0) {
                    setLanguageId(languagesData[0].id);
                    setFileLanguageId(languagesData[0].id);
                }
            } catch (error) {
                console.error("Error fetching problem:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [slug]);

    const fetchSubmissions = useCallback(
        async (page = 0, overrideSize?: number) => {
            if (!problem?.problemId) return;
            const size = overrideSize ?? pageSize;
            try {
                setLoadingSubmissions(true);
                const data = await submissionService.getMySubmissionsByProblem(
                    problem.problemId,
                    page,
                    size,
                    contestId
                );
                setSubmissions(data.content || []);
                setTotalPages(data.totalPages || 0);
                setTotalElements(data.totalElements || 0);
                setSubmissionsPage(data.number || 0);
            } catch (error) {
                console.error("Error fetching submissions:", error);
            } finally {
                setLoadingSubmissions(false);
            }
        },
        [problem?.problemId, pageSize, contestId]
    );

    useEffect(() => {
        if (problem?.problemId) {
            fetchSubmissions(0);
        }
    }, [problem?.problemId, fetchSubmissions]);

    const handleSubmit = async () => {
        if (!problem || !code.trim()) return;

        try {
            setIsSubmitting(true);
            setSubmissionStatus("PENDING");

            const submission = await submissionService.submit({
                problemId: problem.problemId,
                ...(contestId && { contestId }),
                languageId,
                sourceCode: code,
            });

            // Poll for result
            setSubmissionStatus("JUDGING");
            const result = await submissionService.pollSubmission(submission.submissionId);
            setSubmissionStatus(result.status);

            // Refresh submissions list
            fetchSubmissions(0);
        } catch (error) {
            console.error("Error submitting:", error);
            setSubmissionStatus("ERROR");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileSubmit = async () => {
        if (!problem || !selectedFile) return;

        try {
            setIsSubmitting(true);
            setSubmissionStatus("PENDING");

            const fileContent = await selectedFile.text();

            const submission = await submissionService.submit({
                problemId: problem.problemId,
                ...(contestId && { contestId }),
                languageId: fileLanguageId,
                sourceCode: fileContent,
            });

            setSubmissionStatus("JUDGING");
            const result = await submissionService.pollSubmission(submission.submissionId);
            setSubmissionStatus(result.status);
            setSelectedFile(null);

            // Refresh submissions list
            fetchSubmissions(0);
        } catch (error) {
            console.error("Error submitting file:", error);
            setSubmissionStatus("ERROR");
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedLanguage = languages.find((l) => l.id === languageId);
    const getLanguageName = (langId: number) => {
        return languages.find((l) => l.id === langId)?.name || `Lang #${langId}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const startIdx = submissionsPage * pageSize;
    const endIdx = Math.min(startIdx + submissions.length, totalElements);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="text-center py-12">
                <h2 className="text-gray-900 dark:text-white text-xl mb-4">
                    Không tìm thấy bài tập
                </h2>
                <Button onClick={() => navigate("/")}>Về trang chủ</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Problem + Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ minHeight: "60vh" }}>
                {/* Problem Description */}
                <div className="overflow-y-auto space-y-6 pb-6 pr-4">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/")}
                            className="mb-6"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Trở về danh sách
                        </Button>

                        <div className="flex items-center gap-4 mb-5">
                            <h2 className="text-gray-900 dark:text-white text-xl font-bold">
                                {problem.title}
                            </h2>
                            <DifficultyBadge
                                difficulty={problem.difficulty as "EASY" | "MEDIUM" | "HARD"}
                            />
                        </div>

                        <div className="flex items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>Time: {problem.timeLimit}s</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Database className="w-4 h-4" />
                                <span>Memory: {problem.memoryLimit}MB</span>
                            </div>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <h3 className="text-gray-900 dark:text-white font-semibold">
                                Mô tả bài toán
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                                {(problem.problemDescription || problem.description)
                                    ?.split("\n")
                                    .map((para, i) => (
                                        <p key={i} className="mb-3 leading-relaxed">
                                            {para}
                                        </p>
                                    ))}
                            </div>
                        </CardBody>
                    </Card>

                    {problem.sampleInput && (
                        <Card>
                            <CardHeader>
                                <h3 className="text-gray-900 dark:text-white font-semibold">
                                    Ví dụ mẫu
                                </h3>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                        Input:
                                    </p>
                                    <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                        {problem.sampleInput}
                                    </pre>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                        Output:
                                    </p>
                                    <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                        {problem.sampleOutput}
                                    </pre>
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </div>

                {/* Code Editor */}
                <div className="flex flex-col space-y-4">
                    <div className="flex-1 min-h-0">
                        <CodeEditor
                            value={code}
                            onChange={setCode}
                            language={selectedLanguage?.monacoLanguage || "python"}
                        />
                    </div>

                    {/* Submit from editor */}
                    <div className="flex items-center gap-3">
                        <Select
                            options={languages.map((l) => ({
                                value: String(l.id),
                                label: l.name,
                            }))}
                            value={String(languageId)}
                            onChange={(e) => setLanguageId(Number(e.target.value))}
                            className="w-48"
                        />
                        {submissionStatus && <StatusBadge status={submissionStatus} />}
                        <div className="flex-1" />
                        <Button onClick={handleSubmit} disabled={isSubmitting || !code.trim()}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang nộp...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Nộp
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Or</span>
                        </div>
                    </div>

                    {/* File upload */}
                    <div className="flex items-center gap-3">
                        <Select
                            options={languages.map((l) => ({
                                value: String(l.id),
                                label: l.name,
                            }))}
                            value={String(fileLanguageId)}
                            onChange={(e) => setFileLanguageId(Number(e.target.value))}
                            className="w-48"
                        />
                        <label className="cursor-pointer text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                            <input
                                type="file"
                                className="hidden"
                                accept=".cpp,.c,.py,.java,.js,.ts,.cs,.go,.rs,.rb,.php,.kt,.swift"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                            {selectedFile ? selectedFile.name : "Chọn tệp"}
                        </label>
                        <div className="flex-1" />
                        <Button onClick={handleFileSubmit} disabled={isSubmitting || !selectedFile}>
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4 mr-2" />
                            )}
                            Nộp
                        </Button>
                    </div>
                </div>
            </div>

            {/* Submissions List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-900 dark:text-white font-semibold">Bài nộp</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchSubmissions(submissionsPage)}
                            disabled={loadingSubmissions}
                        >
                            <RefreshCw
                                className={`w-4 h-4 mr-2 ${loadingSubmissions ? "animate-spin" : ""}`}
                            />
                            Làm mới
                        </Button>
                    </div>
                </CardHeader>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Điểm</TableHead>
                            <TableHead>Đạt</TableHead>
                            <TableHead>Ngôn ngữ</TableHead>
                            <TableHead>Thời gian tạo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {submissions.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-8 text-gray-500 dark:text-gray-400"
                                >
                                    Không có bản ghi nào để hiển thị
                                </TableCell>
                            </TableRow>
                        ) : (
                            submissions.map((sub) => {
                                const isAccepted = sub.verdict?.toUpperCase() === "ACCEPTED";
                                return (
                                    <TableRow
                                        key={sub.submissionId}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                        onClick={() => navigate(`/submissions/${sub.submissionId}`)}
                                    >
                                        <TableCell className="font-mono text-sm">
                                            {sub.submissionId.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                status={
                                                    sub.status === "DONE"
                                                        ? sub.verdict || "DONE"
                                                        : sub.status
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {sub.status === "DONE" ? (
                                                <span className="font-medium">
                                                    {sub.score ?? 0}/{sub.maxScore ?? 0}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {sub.status === "DONE" ? (
                                                isAccepted ? (
                                                    <span className="text-green-600 font-medium">
                                                        ✓
                                                    </span>
                                                ) : (
                                                    <span className="text-red-600 font-medium">
                                                        ✗
                                                    </span>
                                                )
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{getLanguageName(sub.languageId)}</TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-400">
                                            {formatDate(sub.submittedAt)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                    <div>
                        <Select
                            options={[
                                { value: "5", label: "5 hàng" },
                                { value: "10", label: "10 hàng" },
                                { value: "20", label: "20 hàng" },
                            ]}
                            value={String(pageSize)}
                            onChange={(e) => {
                                const newSize = Number(e.target.value);
                                setPageSize(newSize);
                                fetchSubmissions(0, newSize);
                            }}
                            className="w-28"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchSubmissions(0)}
                            disabled={submissionsPage === 0}
                        >
                            <ChevronsLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchSubmissions(submissionsPage - 1)}
                            disabled={submissionsPage === 0}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-500 dark:text-gray-400 px-2">
                            {totalElements === 0 ? "0-0" : `${startIdx + 1}-${endIdx}`} của{" "}
                            {totalElements}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchSubmissions(submissionsPage + 1)}
                            disabled={submissionsPage >= totalPages - 1}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchSubmissions(totalPages - 1)}
                            disabled={submissionsPage >= totalPages - 1}
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
