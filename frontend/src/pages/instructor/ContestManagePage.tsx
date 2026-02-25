import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input, TextArea } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
    Loader2,
    ChevronRight,
    FileText,
    Users,
    ClipboardList,
    Trash2,
    Plus,
    ChevronLeft,
    Calendar,
    ExternalLink,
    UserPlus,
    Settings,
} from "lucide-react";
import { Modal } from "~/components/ui/Modal";
import { toast } from "sonner";
import { contestService, type Contest, type ContestProblem } from "~/services/contestService";
import { problemService, type ProblemListItem } from "~/services/problemService";
import { submissionService, type Submission } from "~/services/submissionService";
import api from "~/services/api";

interface Participant {
    participantId: string;
    fullName: string;
    joinedAt: string;
}

type Tab = "problems" | "participants" | "submissions" | "settings";

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

export function ContestManagePage() {
    const { contestId } = useParams<{ contestId: string }>();
    const navigate = useNavigate();

    const [contest, setContest] = useState<Contest | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("problems");
    const [loading, setLoading] = useState(true);

    // Problems tab
    const [problems, setProblems] = useState<ContestProblem[]>([]);
    const [showAddProblem, setShowAddProblem] = useState(false);
    const [isEditingProblem, setIsEditingProblem] = useState(false);
    const [addProblemId, setAddProblemId] = useState("");
    const [editProblemTitle, setEditProblemTitle] = useState("");
    const [addMaxSubs, setAddMaxSubs] = useState("");
    const [availableProblems, setAvailableProblems] = useState<ProblemListItem[]>([]);

    // Participants tab
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [participantsLoading, setParticipantsLoading] = useState(false);
    const [showAddParticipant, setShowAddParticipant] = useState(false);
    const [addEmail, setAddEmail] = useState("");
    const [addingParticipant, setAddingParticipant] = useState(false);
    const [addParticipantError, setAddParticipantError] = useState("");

    // Submissions tab
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [subLoading, setSubLoading] = useState(false);
    const [subPage, setSubPage] = useState(0);
    const [subTotalPages, setSubTotalPages] = useState(0);
    const [subTotalElements, setSubTotalElements] = useState(0);
    const [filterProblemId, setFilterProblemId] = useState("");
    const [filterSubmitterId, setFilterSubmitterId] = useState("");
    const [filterVerdict, setFilterVerdict] = useState("");

    // Settings tab
    const [editName, setEditName] = useState("");
    const [editStartTime, setEditStartTime] = useState("");
    const [editEndTime, setEditEndTime] = useState("");
    const [editIsPublic, setEditIsPublic] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        if (!contestId) return;
        loadContest();
        loadProblems();
    }, [contestId]);

    useEffect(() => {
        if (showAddProblem && !isEditingProblem && availableProblems.length === 0) {
            problemService
                .getProblems(0, 1000)
                .then((data) => {
                    setAvailableProblems(data.content || []);
                })
                .catch((err) => console.error("Failed to load available problems:", err));
        }
    }, [showAddProblem, isEditingProblem, availableProblems.length]);

    useEffect(() => {
        if (activeTab === "participants" && contestId) {
            loadParticipants();
        }
        if (activeTab === "submissions" && contestId) {
            loadSubmissions();
        }
    }, [activeTab, contestId]);

    const loadContest = async () => {
        try {
            setLoading(true);
            const data = await contestService.getContest(contestId!);
            setContest(data);

            setEditName(data.contestName);
            // Convert to local datetime string for input format YYYY-MM-DDTHH:mm
            const toLocalString = (iso: string) => {
                if (!iso) return "";
                const d = new Date(iso);
                return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16);
            };
            setEditStartTime(toLocalString(data.startTime));
            setEditEndTime(toLocalString(data.endTime));
            setEditIsPublic(data.isPublic);
        } catch (err) {
            console.error("Failed to load contest:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadProblems = async () => {
        try {
            const data = await contestService.getContestProblems(contestId!);
            setProblems(data || []);
        } catch (err) {
            console.error("Failed to load problems:", err);
        }
    };

    const loadParticipants = async () => {
        try {
            setParticipantsLoading(true);
            const data = await contestService.getParticipants(contestId!);
            setParticipants(data || []);
        } catch (err) {
            console.error("Failed to load participants:", err);
        } finally {
            setParticipantsLoading(false);
        }
    };

    const handleAddParticipant = async () => {
        if (!addEmail.trim()) return;

        // Extract emails from input separated by commas, spaces, or newlines
        const emails = addEmail
            .split(/[\s,]+/)
            .map((e) => e.trim())
            .filter((e) => e !== "");

        if (emails.length === 0) return;

        try {
            setAddingParticipant(true);
            setAddParticipantError("");
            const res = await contestService.addParticipants(contestId!, emails);
            setShowAddParticipant(false);
            setAddEmail("");
            loadParticipants();

            if (res.result > 0) {
                toast.success(`Đã thêm thành công ${res.result} thí sinh.`);
            } else {
                toast.error("Không có thí sinh nào được thêm (email sai hoặc đã tồn tại).");
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Không thể thêm thí sinh.";
            setAddParticipantError(msg);
        } finally {
            setAddingParticipant(false);
        }
    };

    const handleRemoveParticipant = async (userId: string, name: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa thí sinh "${name}" khỏi cuộc thi?`)) return;
        try {
            await contestService.removeParticipant(contestId!, userId);
            loadParticipants();
            toast.success("Đã xóa thí sinh.");
        } catch (err) {
            console.error("Failed to remove participant:", err);
            toast.error("Không thể xóa thí sinh.");
        }
    };

    const loadSubmissions = useCallback(async () => {
        if (!contestId) return;
        try {
            setSubLoading(true);
            const data = await submissionService.searchContestSubmissions(
                contestId,
                {
                    problemId: filterProblemId || undefined,
                    submitterId: filterSubmitterId || undefined,
                    verdict: filterVerdict || undefined,
                },
                subPage,
                20
            );
            setSubmissions(data.content || []);
            setSubTotalPages(data.totalPages || 0);
            setSubTotalElements(data.totalElements || 0);
        } catch (err) {
            console.error("Failed to load submissions:", err);
        } finally {
            setSubLoading(false);
        }
    }, [contestId, subPage, filterProblemId, filterSubmitterId, filterVerdict]);

    useEffect(() => {
        if (activeTab === "submissions") {
            loadSubmissions();
        }
    }, [loadSubmissions, activeTab]);

    const handleAddProblem = async () => {
        if (!addProblemId.trim()) return;
        try {
            await contestService.addProblemToContest(contestId!, {
                problemId: addProblemId.trim(),
                maxSubmissions: addMaxSubs ? parseInt(addMaxSubs) : undefined,
            });
            setShowAddProblem(false);
            setAddProblemId("");
            setAddMaxSubs("");
            loadProblems();
            if (isEditingProblem) {
                toast.success("Đã cập nhật giới hạn bài nộp.");
            } else {
                toast.success("Đã thêm bài tập.");
            }
        } catch (err) {
            console.error("Failed to add problem:", err);
            toast.error(
                isEditingProblem
                    ? "Không thể cập nhật giới hạn."
                    : "Không thể thêm bài tập, kiểm tra lại ID."
            );
        }
    };

    const handleRemoveProblem = async (problemId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa bài tập này khỏi cuộc thi?")) return;
        try {
            await api.delete(`/contests/${contestId}/problems/${problemId}`);
            loadProblems();
            toast.success("Đã xóa bài tập.");
        } catch (err) {
            console.error("Failed to remove problem:", err);
            toast.error("Không thể xóa bài tập.");
        }
    };

    const handleSaveSettings = async () => {
        try {
            setSavingSettings(true);
            const req = {
                contestName: editName.trim() ? editName.trim() : undefined,
                startTime: editStartTime ? new Date(editStartTime).toISOString() : undefined,
                endTime: editEndTime ? new Date(editEndTime).toISOString() : undefined,
                isPublic: editIsPublic,
            };
            await contestService.updateContest(contestId!, req);
            toast.success("Đã cập nhật cài đặt cuộc thi.");
            loadContest(); // Refresh basic info
        } catch (err) {
            console.error("Failed to update contest:", err);
            toast.error("Cập nhật cài đặt thất bại.");
        } finally {
            setSavingSettings(false);
        }
    };

    const handleSubFilter = () => {
        setSubPage(0);
        loadSubmissions();
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    if (!contest) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Không tìm thấy cuộc thi.</p>
            </div>
        );
    }

    const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
        { key: "problems", label: "Bài tập", icon: FileText },
        { key: "participants", label: "Thí sinh", icon: Users },
        { key: "submissions", label: "Tất cả bài nộp", icon: ClipboardList },
        { key: "settings", label: "Cài đặt", icon: Settings },
    ];

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
                    to="/instructor/contests"
                    className="hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    Cuộc thi
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 dark:text-white font-medium">
                    {contest.contestName}
                </span>
            </nav>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {contest.contestName}
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(contest.startTime)} — {formatDate(contest.endTime)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {contest.participantCount} thí sinh
                        </span>
                        <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {contest.problemCount} bài tập
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-0">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    isActive
                                        ? "border-red-500 text-red-600 dark:text-red-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === "problems" && (
                <Card>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Danh sách bài tập ({problems.length})
                        </h3>
                        <Button
                            size="sm"
                            onClick={() => {
                                setIsEditingProblem(false);
                                setAddProblemId("");
                                setAddMaxSubs("");
                                setShowAddProblem(true);
                            }}
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Thêm bài tập
                        </Button>
                    </div>
                    {problems.length === 0 ? (
                        <div className="text-center py-10">
                            <FileText className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">
                                Chưa có bài tập nào trong cuộc thi
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                            Bài tập
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                            Độ khó
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                            Điểm tối đa
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                            Giới hạn nộp
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {problems.map((p) => (
                                        <tr
                                            key={p.problemId}
                                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {p.title}
                                                </span>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {p.slug}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {p.difficulty ? (
                                                    <Badge
                                                        variant={
                                                            p.difficulty === "EASY"
                                                                ? "success"
                                                                : p.difficulty === "MEDIUM"
                                                                  ? "warning"
                                                                  : "error"
                                                        }
                                                    >
                                                        {p.difficulty}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-gray-600 dark:text-gray-300">
                                                    {(p as any).maxScore ?? "—"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-gray-600 dark:text-gray-300">
                                                    {p.maxSubmissions ?? "∞"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setIsEditingProblem(true);
                                                            setAddProblemId(p.problemId);
                                                            setEditProblemTitle(p.title);
                                                            setAddMaxSubs(
                                                                p.maxSubmissions
                                                                    ? p.maxSubmissions.toString()
                                                                    : ""
                                                            );
                                                            setShowAddProblem(true);
                                                        }}
                                                        title="Sửa giới hạn"
                                                    >
                                                        <FileText className="w-4 h-4 text-blue-500" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleRemoveProblem(p.problemId)
                                                        }
                                                        title="Xóa khỏi cuộc thi"
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

                    {/* Add/Edit Problem Modal */}
                    {showAddProblem && (
                        <Modal
                            isOpen={showAddProblem}
                            onClose={() => setShowAddProblem(false)}
                            title={
                                isEditingProblem
                                    ? "Sửa giới hạn bài nộp"
                                    : "Thêm bài tập vào cuộc thi"
                            }
                            footer={
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAddProblem(false)}
                                    >
                                        Hủy
                                    </Button>
                                    <Button onClick={handleAddProblem}>
                                        {isEditingProblem ? "Xác nhận" : "Thêm"}
                                    </Button>
                                </>
                            }
                        >
                            <div className="space-y-4">
                                {isEditingProblem ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Bài tập
                                        </label>
                                        <div className="px-3 py-2 font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                            {editProblemTitle}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Chọn bài tập
                                        </label>
                                        <select
                                            value={addProblemId}
                                            onChange={(e) => setAddProblemId(e.target.value)}
                                            className="flex w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-950 dark:border-gray-700 dark:text-white dark:focus:ring-red-600"
                                        >
                                            <option value="">-- Chọn bài tập --</option>
                                            {availableProblems.map((ap) => (
                                                <option key={ap.problemId} value={ap.problemId}>
                                                    {ap.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Giới hạn bài nộp (bỏ trống = không giới hạn)
                                    </label>
                                    <Input
                                        type="number"
                                        value={addMaxSubs}
                                        onChange={(e) => setAddMaxSubs(e.target.value)}
                                        placeholder="VD: 10"
                                    />
                                </div>
                            </div>
                        </Modal>
                    )}
                </Card>
            )}

            {activeTab === "participants" && (
                <Card>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Danh sách thí sinh ({participants.length})
                        </h3>
                        <Button
                            size="sm"
                            onClick={() => {
                                setShowAddParticipant(true);
                                setAddParticipantError("");
                            }}
                        >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Thêm thí sinh
                        </Button>
                    </div>
                    {participantsLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                        </div>
                    ) : participants.length === 0 ? (
                        <div className="text-center py-10">
                            <Users className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">
                                Chưa có thí sinh nào tham gia
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                            #
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                            Họ tên
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                            Thời gian tham gia
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participants.map((p, idx) => (
                                        <tr
                                            key={p.participantId}
                                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        >
                                            <td className="px-6 py-3 text-gray-500">{idx + 1}</td>
                                            <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                                                {p.fullName}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                {formatDate(p.joinedAt)}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center justify-end">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleRemoveParticipant(
                                                                p.participantId,
                                                                p.fullName
                                                            )
                                                        }
                                                        title="Xóa khỏi cuộc thi"
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

                    {/* Add Participant Modal */}
                    {showAddParticipant && (
                        <Modal
                            isOpen={showAddParticipant}
                            onClose={() => {
                                setShowAddParticipant(false);
                                setAddEmail("");
                                setAddParticipantError("");
                            }}
                            title="Thêm thí sinh vào cuộc thi"
                            footer={
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowAddParticipant(false);
                                            setAddEmail("");
                                            setAddParticipantError("");
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        onClick={handleAddParticipant}
                                        disabled={addingParticipant}
                                    >
                                        {addingParticipant ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />{" "}
                                                Đang thêm...
                                            </>
                                        ) : (
                                            "Thêm"
                                        )}
                                    </Button>
                                </>
                            }
                        >
                            <div className="space-y-4">
                                <div>
                                    <TextArea
                                        label="Danh sách Email thí sinh"
                                        value={addEmail}
                                        onChange={(e) => {
                                            setAddEmail(e.target.value);
                                            setAddParticipantError("");
                                        }}
                                        placeholder="Nhập hoặc dán danh sách email (ngăn cách bằng khoảng trắng, dòng mới, hoặc dấu phẩy)..."
                                        rows={6}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Server sẽ tự động bỏ qua các email không hợp lệ hoặc đã có
                                        trong kỳ thi.
                                    </p>
                                </div>
                                {addParticipantError && (
                                    <p className="text-sm text-red-500">{addParticipantError}</p>
                                )}
                            </div>
                        </Modal>
                    )}
                </Card>
            )}

            {activeTab === "submissions" && (
                <div className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <div className="p-4 flex flex-wrap items-end gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Bài tập
                                </label>
                                <select
                                    value={filterProblemId}
                                    onChange={(e) => setFilterProblemId(e.target.value)}
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                >
                                    <option value="">Tất cả bài tập</option>
                                    {problems.map((p) => (
                                        <option key={p.problemId} value={p.problemId}>
                                            {p.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Thí sinh
                                </label>
                                <Input
                                    value={filterSubmitterId}
                                    onChange={(e) => setFilterSubmitterId(e.target.value)}
                                    placeholder="Tên thí sinh..."
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
                            <Button size="sm" onClick={handleSubFilter}>
                                Lọc
                            </Button>
                        </div>
                    </Card>

                    {/* Submissions Table */}
                    <Card>
                        {subLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                            </div>
                        ) : submissions.length === 0 ? (
                            <div className="text-center py-10">
                                <ClipboardList className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    Không có bài nộp nào
                                </p>
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
                                                Thí sinh
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                                Bài tập
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
                                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                    {s.problemTitle}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getVerdictBadge(s.verdict)}
                                                </td>
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
                                                    {s.totalTimeMs != null
                                                        ? `${s.totalTimeMs}ms`
                                                        : "—"}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            navigate(
                                                                `/instructor/submissions/${s.submissionId}`
                                                            )
                                                        }
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {subTotalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Trang {subPage + 1} / {subTotalPages} ({subTotalElements} bài
                                    nộp)
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={subPage === 0}
                                        onClick={() => setSubPage(subPage - 1)}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={subPage >= subTotalPages - 1}
                                        onClick={() => setSubPage(subPage + 1)}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === "settings" && (
                <Card>
                    <div className="p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
                            Cài đặt cuộc thi
                        </h3>

                        <div className="max-w-xl space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Tên cuộc thi
                                </label>
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Ví dụ: Kỳ thi cuối kỳ..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Thời gian bắt đầu
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={editStartTime}
                                        onChange={(e) => setEditStartTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Thời gian kết thúc
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={editEndTime}
                                        onChange={(e) => setEditEndTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isPublic"
                                    checked={editIsPublic}
                                    onChange={(e) => setEditIsPublic(e.target.checked)}
                                    className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <label
                                    htmlFor="isPublic"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                                >
                                    Công khai{" "}
                                    <span className="text-xs font-normal text-gray-500 ml-1">
                                        (Bất kỳ ai cũng có thể tự do tham gia nếu biết link)
                                    </span>
                                </label>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button onClick={handleSaveSettings} disabled={savingSettings}>
                                    {savingSettings ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        "Lưu thay đổi"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
