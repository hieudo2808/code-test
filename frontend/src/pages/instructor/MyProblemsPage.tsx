import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge, DifficultyBadge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import {
    FileText,
    Plus,
    Edit,
    Trash2,
    Loader2,
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
} from "lucide-react";
import { Modal } from "~/components/ui/Modal";
import { problemService, type ProblemListItem } from "~/services/problemService";
import { toast } from "sonner";

export function MyProblemsPage() {
    const navigate = useNavigate();
    const [problems, setProblems] = useState<ProblemListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        id: string;
        title: string;
    } | null>(null);

    const loadProblems = useCallback(async () => {
        try {
            setLoading(true);
            const data = await problemService.getMyProblems(page, 20, keyword || undefined);
            setProblems(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (err) {
            console.error("Failed to load problems:", err);
        } finally {
            setLoading(false);
        }
    }, [page, keyword]);

    useEffect(() => {
        loadProblems();
    }, [loadProblems]);

    const handleSearch = () => {
        setPage(0);
        setKeyword(searchInput);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleDelete = async () => {
        if (!deleteModal) return;
        try {
            setProblems(problems.filter((p) => p.problemId !== deleteModal.id));
            await problemService.deleteProblem(deleteModal.id);
            loadProblems();
            toast.success("Đã xóa bài tập.");
        } catch (error) {
            console.error("Failed to delete:", error);
            toast.error("Không thể xóa bài tập. Bài tập có thể đã có bài nộp.");
        }
        setDeleteModal(null);
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
                <span className="text-gray-900 dark:text-white font-medium">Quản lý bài tập</span>
            </nav>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Quản lý bài tập
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {totalElements} bài tập của bạn
                    </p>
                </div>
                <Button onClick={() => navigate("/instructor/problems/new")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo bài tập
                </Button>
            </div>

            {/* Search */}
            <div className="flex gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm theo tên bài tập..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline" onClick={handleSearch}>
                    Tìm kiếm
                </Button>
            </div>

            {/* Table */}
            <Card>
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                        <span className="ml-2 text-gray-500">Đang tải...</span>
                    </div>
                ) : problems.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {keyword ? "Không tìm thấy bài tập nào" : "Bạn chưa tạo bài tập nào"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Tên bài tập
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Độ khó
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Điểm tối đa
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Tỷ lệ AC
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {problems.map((problem) => (
                                    <tr
                                        key={problem.problemId}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {problem.title}
                                            </span>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {problem.slug}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <DifficultyBadge difficulty={problem.difficulty} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-600 dark:text-gray-300">
                                                {problem.maxScore}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-600 dark:text-gray-300">
                                                {problem.acceptanceRate != null
                                                    ? `${problem.acceptanceRate.toFixed(1)}%`
                                                    : "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        navigate(
                                                            `/instructor/problems/${problem.problemId}/submissions`
                                                        )
                                                    }
                                                    title="Xem bài nộp"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        navigate(
                                                            `/instructor/problems/${problem.problemId}/edit`
                                                        )
                                                    }
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setDeleteModal({
                                                            isOpen: true,
                                                            id: problem.problemId,
                                                            title: problem.title,
                                                        })
                                                    }
                                                    title="Xóa"
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
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Trang {page + 1} / {totalPages} ({totalElements} bài tập)
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
                    title="Xóa bài tập"
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
                        Bạn có chắc chắn muốn xóa bài tập <strong>"{deleteModal.title}"</strong>?
                        Hành động này không thể hoàn tác.
                    </p>
                </Modal>
            )}
        </div>
    );
}
