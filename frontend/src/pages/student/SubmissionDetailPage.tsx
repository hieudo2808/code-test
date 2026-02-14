import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardHeader, CardBody } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { StatusBadge } from "~/components/ui/badge";
import { CodeEditor } from "~/components/ui/CodeEditor";
import { Modal } from "~/components/ui/Modal";
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
    Loader2,
    CheckCircle,
    ChevronUp,
    ChevronDown,
    Copy,
    Check,
    Eye,
    XCircle,
} from "lucide-react";
import {
    submissionService,
    type Submission,
    type SubmissionResult,
    type TestcaseDetail,
} from "~/services/submissionService";
import { languageService, type Language } from "~/services/languageService";

export function SubmissionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSource, setShowSource] = useState(true);
    const [copied, setCopied] = useState(false);
    const [detailModal, setDetailModal] = useState<{
        open: boolean;
        loading: boolean;
        data: TestcaseDetail | null;
        tcIndex: number;
    }>({ open: false, loading: false, data: null, tcIndex: 0 });

    useEffect(() => {
        async function fetchData() {
            if (!id) return;
            try {
                setLoading(true);
                const [subData, langsData] = await Promise.all([
                    submissionService.getSubmission(id),
                    languageService.getLanguages(),
                ]);
                setSubmission(subData);
                setLanguages(langsData);
            } catch (error) {
                console.error("Error fetching submission:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const getLanguageName = (langId: number) => {
        return languages.find((l) => l.id === langId)?.name || `Lang #${langId}`;
    };

    const getMonacoLanguage = (langId: number) => {
        return languages.find((l) => l.id === langId)?.monacoLanguage || "plaintext";
    };

    const handleCopy = async () => {
        if (submission?.sourceCode) {
            await navigator.clipboard.writeText(submission.sourceCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleViewDetail = async (tc: SubmissionResult, index: number) => {
        if (!id || !tc.testcaseId || tc.isHidden) return;
        setDetailModal({ open: true, loading: true, data: null, tcIndex: index });
        try {
            const data = await submissionService.getTestcaseDetail(id, tc.testcaseId);
            setDetailModal({ open: true, loading: false, data, tcIndex: index });
        } catch (error) {
            console.error("Error fetching testcase detail:", error);
            setDetailModal({ open: false, loading: false, data: null, tcIndex: index });
        }
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="text-center py-12">
                <h2 className="text-gray-900 dark:text-white text-xl mb-4">
                    Không tìm thấy bài nộp
                </h2>
                <Button onClick={() => navigate("/")}>Về trang chủ</Button>
            </div>
        );
    }

    const passedTests =
        submission.results?.filter((t) => t.verdict === "ACCEPTED").length || 0;
    const totalTests = submission.results?.length || 0;

    const verdictIcon = (tc: SubmissionResult) => {
        if (tc.verdict === "ACCEPTED") {
            return <CheckCircle className="w-5 h-5 text-green-500" />;
        }
        return <XCircle className="w-5 h-5 text-red-500" />;
    };

    return (
        <div className="flex gap-6">
            {/* Main content */}
            <div className="flex-1 space-y-6 min-w-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/problems/${submission.problemId}`)}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại bài tập
                </Button>

                {/* Test Case Results */}
                {submission.results && submission.results.length > 0 && (
                    <Card>
                        <CardHeader>
                            <h3 className="text-gray-900 dark:text-white font-semibold">
                                Test Case
                            </h3>
                        </CardHeader>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tình điểm</TableHead>
                                    <TableHead>Điểm</TableHead>
                                    <TableHead>Thông báo</TableHead>
                                    <TableHead>Thời gian chạy (ms)</TableHead>
                                    <TableHead>Bộ nhớ (MB)</TableHead>
                                    <TableHead>Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {submission.results.map((tc, index) => (
                                    <TableRow key={tc.testcaseId || index}>
                                        <TableCell>
                                            {verdictIcon(tc)}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {tc.score ?? 0}
                                        </TableCell>
                                        <TableCell>
                                            {tc.verdict === "ACCEPTED"
                                                ? "Accepted"
                                                : tc.verdict || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {tc.timeMs != null ? tc.timeMs : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {tc.memoryKb != null
                                                ? (tc.memoryKb / 1024).toFixed(2)
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {tc.isHidden ? (
                                                <span className="text-xs text-gray-400">Ẩn</span>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-500"
                                                    onClick={() => handleViewDetail(tc, index)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}

                {/* Source Code */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <button
                                className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold"
                                onClick={() => setShowSource(!showSource)}
                            >
                                Mã nguồn
                                {showSource ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </CardHeader>
                    {showSource && (
                        submission.sourceCode ? (
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2 z-10"
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                                <CodeEditor
                                    value={submission.sourceCode}
                                    onChange={() => {}}
                                    language={getMonacoLanguage(submission.languageId)}
                                    readOnly={true}
                                />
                            </div>
                        ) : (
                            <CardBody>
                                <p className="text-gray-400 text-sm">Không có mã nguồn</p>
                            </CardBody>
                        )
                    )}
                </Card>
            </div>

            {/* Sidebar */}
            <div className="w-72 shrink-0">
                <Card className="sticky top-4">
                    <CardBody className="space-y-5">
                        {/* Trạng thái */}
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                Trạng thái
                            </p>
                            <StatusBadge
                                status={
                                    submission.status === "DONE"
                                        ? submission.verdict || "DONE"
                                        : submission.status
                                }
                            />
                        </div>

                        {/* Đạt */}
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                Đạt
                            </p>
                            <p className="text-gray-900 dark:text-white">
                                {passedTests} / {totalTests} test case
                            </p>
                        </div>

                        {/* Điểm */}
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                Điểm
                            </p>
                            <p className="text-gray-900 dark:text-white font-medium">
                                {submission.score ?? 0}
                            </p>
                        </div>

                        {/* Ngôn ngữ */}
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                Ngôn ngữ
                            </p>
                            <p className="text-gray-900 dark:text-white">
                                {getLanguageName(submission.languageId)}
                            </p>
                        </div>

                        {/* Tổng thời gian chạy */}
                        {submission.totalTimeMs != null && (
                            <div>
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                    Tổng thời gian chạy
                                </p>
                                <p className="text-gray-900 dark:text-white">
                                    {(submission.totalTimeMs / 1000).toFixed(3)} (s)
                                </p>
                            </div>
                        )}

                        {/* Thời gian tạo */}
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                Thời gian tạo
                            </p>
                            <p className="text-gray-900 dark:text-white">
                                {formatDate(submission.submittedAt)}
                            </p>
                        </div>

                        {/* Bài tập */}
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                Bài tập
                            </p>
                            <Link
                                to={`/problems/${submission.problemId}`}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                            >
                                {submission.problemTitle}
                            </Link>
                        </div>

                        {/* Cuộc thi */}
                        {submission.contestId && (
                            <div>
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                    Cuộc thi
                                </p>
                                <Link
                                    to={`/contests/${submission.contestId}`}
                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                                >
                                    Xem cuộc thi
                                </Link>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Testcase Detail Modal */}
            <Modal
                isOpen={detailModal.open}
                onClose={() => setDetailModal({ ...detailModal, open: false })}
                title={`Xem chi tiết`}
            >
                {detailModal.loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                    </div>
                ) : detailModal.data ? (
                    <div className="space-y-4">
                        {/* Expected Output */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                        Đầu ra đúng
                                    </p>
                                    <button
                                        className="text-gray-400 hover:text-gray-200"
                                        onClick={() => copyToClipboard(detailModal.data?.expectedOutput || "")}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                                <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg text-sm overflow-auto max-h-48 whitespace-pre-wrap break-words">
                                    {detailModal.data.expectedOutput || "(trống)"}
                                </pre>
                            </div>

                            {/* User Output */}
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                        Đầu ra chương trình
                                    </p>
                                    <button
                                        className="text-gray-400 hover:text-gray-200"
                                        onClick={() => copyToClipboard(detailModal.data?.actualOutput || "")}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                                <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg text-sm overflow-auto max-h-48 whitespace-pre-wrap break-words">
                                    {detailModal.data.actualOutput || "(trống)"}
                                </pre>
                            </div>
                        </div>

                        {/* Input */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                    Đầu vào
                                </p>
                                <button
                                    className="text-gray-400 hover:text-gray-200"
                                    onClick={() => copyToClipboard(detailModal.data?.input || "")}
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                            <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg text-sm overflow-auto max-h-48 whitespace-pre-wrap break-words">
                                {detailModal.data.input || "(trống)"}
                            </pre>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
}
