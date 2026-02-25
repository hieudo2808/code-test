import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
    Trophy,
    Plus,
    Trash2,
    Loader2,
    Search,
    ChevronLeft,
    ChevronRight,
    Settings,
    Users,
    Calendar,
} from "lucide-react";
import { Modal } from "~/components/ui/Modal";
import { contestService, type Contest } from "~/services/contestService";
import { toast } from "sonner";

export function MyContestsPage() {
    const navigate = useNavigate();
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [searchInput, setSearchInput] = useState("");
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        id: string;
        name: string;
    } | null>(null);

    const loadContests = useCallback(async () => {
        try {
            setLoading(true);
            const data = await contestService.getMyContests(page, 20);
            const allContests: Contest[] = data.content || [];
            // Client-side filter since backend doesn't have search for contests yet
            const filtered = searchInput
                ? allContests.filter((c) =>
                      c.contestName.toLowerCase().includes(searchInput.toLowerCase())
                  )
                : allContests;
            setContests(filtered);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (err) {
            console.error("Failed to load contests:", err);
        } finally {
            setLoading(false);
        }
    }, [page, searchInput]);

    useEffect(() => {
        loadContests();
    }, [loadContests]);

    const handleSearch = () => {
        setPage(0);
        loadContests();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleDelete = async () => {
        if (!deleteModal) return;
        try {
            await contestService.deleteContest(deleteModal.id);
            setContests((prevContests) =>
                prevContests.filter((c) => c.contestId !== deleteModal.id)
            );
            loadContests();
            toast.success("Đã xóa cuộc thi.");
        } catch (error) {
            console.error("Failed to delete:", error);
            toast.error("Không thể xóa cuộc thi.");
        }
        setDeleteModal(null);
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
            case "FROZEN":
                return (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Đã đóng băng
                    </span>
                );
            default:
                return null;
        }
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
                <span className="text-gray-900 dark:text-white font-medium">Quản lý cuộc thi</span>
            </nav>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Quản lý cuộc thi
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {totalElements} cuộc thi của bạn
                    </p>
                </div>
                <Button onClick={() => navigate("/instructor/contests/new")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo cuộc thi
                </Button>
            </div>

            {/* Search */}
            <div className="flex gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm theo tên cuộc thi..."
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
                ) : contests.length === 0 ? (
                    <div className="text-center py-12">
                        <Trophy className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchInput
                                ? "Không tìm thấy cuộc thi nào"
                                : "Bạn chưa tạo cuộc thi nào"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Tên cuộc thi
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Thời gian
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Bài tập
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Thí sinh
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {contests.map((contest) => (
                                    <tr
                                        key={contest.contestId}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                        onClick={() =>
                                            navigate(`/instructor/contests/${contest.contestId}`)
                                        }
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {contest.contestName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStateBadge(contest.state)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{formatDate(contest.startTime)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-gray-600 dark:text-gray-300">
                                                {contest.problemCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Users className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-gray-600 dark:text-gray-300">
                                                    {contest.participantCount}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div
                                                className="flex items-center justify-end gap-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        navigate(
                                                            `/instructor/contests/${contest.contestId}`
                                                        )
                                                    }
                                                    title="Quản lý"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setDeleteModal({
                                                            isOpen: true,
                                                            id: contest.contestId,
                                                            name: contest.contestName,
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
                            Trang {page + 1} / {totalPages} ({totalElements} cuộc thi)
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
                    title="Xóa cuộc thi"
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
                        Bạn có chắc chắn muốn xóa cuộc thi <strong>"{deleteModal.name}"</strong>?
                        Hành động này không thể hoàn tác.
                    </p>
                </Modal>
            )}
        </div>
    );
}
