import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
    Loader2,
    ChevronRight,
    ChevronLeft,
    ClipboardList,
    ExternalLink,
    Trash2,
} from "lucide-react";
import { submissionService, type Submission } from "~/services/submissionService";
import { problemService, type Problem } from "~/services/problemService";

import { Modal } from "~/components/ui/Modal";
import { toast } from "sonner";

const VERDICT_OPTIONS = [
    { value: "", label: "Tất cả" },
    { value: "ACCEPTED", label: "Accepted" },
    { value: "PARTIAL", label: "Partial" },
    { value: "FAILED", label: "Failed" },
    { value: "TIME_LIMIT", label: "TLE" },
    { value: "MEMORY_LIMIT", label: "MLE" },
    { value: "RUNTIME_ERROR", label: "Runtime Error" },
    { value: "COMPILE_ERROR", label: "Compile Error" },
    { value: "SCORED", label: "Scored" },
    { value: "MANUAL", label: "Manual" },
];

export function ProblemSubmissionsPage() {
    const { problemId } = useParams<{ problemId: string }>();
    const navigate = useNavigate();

    const [problem, setProblem] = useState<Problem | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [filterSubmitterId, setFilterSubmitterId] = useState("");
    const [filterVerdict, setFilterVerdict] = useState("");

    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        id: string;
        title: string;
    } | null>(null);

    useEffect(() => {
        if (!problemId) return;
        problemService.getProblem(problemId).then(setProblem).catch(console.error);
    }, [problemId]);

    const loadSubmissions = useCallback(async () => {
        if (!problemId) return;
        try {
            setLoading(true);
            const data = await submissionService.searchProblemSubmissions(
                problemId,
                {
                    submitterId: filterSubmitterId || undefined,
                    verdict: filterVerdict || undefined,
                },
                page,
                20
            );
            setSubmissions(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (err) {
            console.error("Failed to load submissions:", err);
        } finally {
            setLoading(false);
        }
    }, [problemId, page, filterSubmitterId, filterVerdict]);

    useEffect(() => {
        loadSubmissions();
    }, [loadSubmissions]);

    const handleFilter = () => {
        setPage(0);
        loadSubmissions();
    };

    const handleDelete = async () => {
        if (!deleteModal) return;
        try {
            await submissionService.deleteSubmission(deleteModal.id);
            toast.success("Đã xóa bài nộp.");
            setSubmissions(submissions.filter((s) => s.submissionId !== deleteModal.id));
            setTotalElements((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to delete submission:", error);
            toast.error("Không thể xóa bài nộp này.");
        } finally {
            setDeleteModal(null);
        }
    };

    const getVerdictBadge = (verdict?: string) => {
        if (!verdict) return <span className="text-gray-400">—</span>;
        const colors: Record<string, string> = {
            ACCEPTED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            PARTIAL: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            TIME_LIMIT: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            MEMORY_LIMIT:
                "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            RUNTIME_ERROR:
                "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            COMPILE_ERROR: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
            SCORED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            MANUAL: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
        };
        const cls =
            colors[verdict] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
        return (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${cls}`}>
                {verdict.replace(/_/g, " ")}
            </span>
        );
    };

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Link
                    to="/instructor"
                    className="hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    Dashboard
                </Link>
                <ChevronRight className="w-4 h-4" />
                <Link
                    to="/instructor/problems"
                    className="hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    Bài tập
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 dark:text-white font-medium">
                    {problem?.title ?? "Bài nộp"}
                </span>
            </nav>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Bài nộp — {problem?.title ?? "..."}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {totalElements} bài nộp (chỉ bài nộp luyện tập, không bao gồm bài nộp trong cuộc
                    thi)
                </p>
            </div>

            {/* Filters */}
            <Card>
                <div className="p-4 flex flex-wrap items-end gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Sinh viên
                        </label>
                        <Input
                            value={filterSubmitterId}
                            onChange={(e) => setFilterSubmitterId(e.target.value)}
                            placeholder="Tên sinh viên..."
                            className="w-56"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Kết quả
                        </label>
                        <select
                            value={filterVerdict}
                            onChange={(e) => setFilterVerdict(e.target.value)}
                            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                        >
                            {VERDICT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button size="sm" onClick={handleFilter}>
                        Lọc
                    </Button>
                </div>
            </Card>

            {/* Submissions Table */}
            <Card>
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="text-center py-10">
                        <ClipboardList className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">Không có bài nộp nào</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Thời gian
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Sinh viên
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Kết quả
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Điểm
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Thời gian chạy
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Chi tiết
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((s) => (
                                    <tr
                                        key={s.submissionId}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(s.submittedAt)}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                            {s.submitterName}
                                        </td>
                                        <td className="px-4 py-3">{getVerdictBadge(s.verdict)}</td>
                                        <td className="px-4 py-3 text-center text-sm">
                                            {s.score != null ? (
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {s.score}/{s.maxScore}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                                            {s.totalTimeMs != null ? `${s.totalTimeMs}ms` : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        navigate(
                                                            `/instructor/submissions/${s.submissionId}`
                                                        )
                                                    }
                                                    title="Chi tiết"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setDeleteModal({
                                                            isOpen: true,
                                                            id: s.submissionId,
                                                            title: `bài nộp của ${s.submitterName}`,
                                                        })
                                                    }
                                                    title="Xóa bài nộp"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Trang {page + 1} / {totalPages} ({totalElements} bài nộp)
                        </p>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page === 0}
                                onClick={() => setPage(page - 1)}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(page + 1)}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Delete Modal */}
            {deleteModal && (
                <Modal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal(null)}
                    title="Xóa bài nộp"
                    footer={
                        <>
                            <Button variant="outline" onClick={() => setDeleteModal(null)}>
                                Hủy
                            </Button>
                            <Button variant="danger" onClick={handleDelete}>
                                Xóa
                            </Button>
                        </>
                    }
                >
                    <p className="text-gray-700 dark:text-gray-300">
                        Bạn có chắc chắn muốn xóa <strong>{deleteModal.title}</strong>? Hành động
                        này không thể hoàn tác.
                    </p>
                </Modal>
            )}
        </div>
    );
}
