import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { StatusBadge } from "~/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Clock, Database, Trophy, Loader2 } from "lucide-react";
import { submissionService, type Submission } from "~/services/submissionService";

export function SubmissionResultPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!id) return;
            try {
                setLoading(true);
                const data = await submissionService.getSubmission(id);
                setSubmission(data);
            } catch (error) {
                console.error("Error fetching submission:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

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

    const isAccepted = submission.verdict === "ACCEPTED";
    const passedTests = submission.results?.filter((t) => t.verdict === "ACCEPTED").length || 0;
    const totalTests = submission.results?.length || 0;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Trở về danh sách
                </Button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-gray-900 dark:text-white text-2xl font-bold mb-2">
                            Kết quả bài nộp
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Bài tập: {submission.problemTitle}
                        </p>
                    </div>
                    <StatusBadge status={submission.verdict || submission.status} />
                </div>
            </div>

            {/* Result Summary */}
            <Card className={isAccepted ? "border-green-500 border-2" : "border-red-500 border-2"}>
                <CardBody>
                    <div className="flex items-center gap-6">
                        <div
                            className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                                isAccepted
                                    ? "bg-linear-to-br from-green-500 to-green-600"
                                    : "bg-linear-to-br from-red-500 to-red-600"
                            }`}
                        >
                            {isAccepted ? (
                                <CheckCircle className="w-10 h-10 text-white" />
                            ) : (
                                <XCircle className="w-10 h-10 text-white" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h2
                                className={`text-2xl font-bold ${
                                    isAccepted ? "text-green-600" : "text-red-600"
                                }`}
                            >
                                {isAccepted ? "Chính xác!" : submission.verdict || "Đang chấm..."}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                {isAccepted
                                    ? "Chúc mừng! Bài làm của bạn đã được chấp nhận."
                                    : "Bài làm của bạn chưa chính xác. Hãy thử lại!"}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {submission.score || 0}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">
                                / {submission.maxScore || 100} điểm
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardBody>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Thời gian chạy
                                </p>
                                <p className="text-gray-900 dark:text-white text-xl font-bold">
                                    {submission.timeMs || 0} ms
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                                <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Bộ nhớ</p>
                                <p className="text-gray-900 dark:text-white text-xl font-bold">
                                    {((submission.memoryKb || 0) / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Test cases đúng
                                </p>
                                <p className="text-gray-900 dark:text-white text-xl font-bold">
                                    {passedTests}/{totalTests}
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Test Case Results */}
            {submission.results && submission.results.length > 0 && (
                <Card>
                    <CardHeader>
                        <h3 className="text-gray-900 dark:text-white font-semibold">
                            Chi tiết từng test case
                        </h3>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                        Test
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                        Kết quả
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                        Thời gian
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                        Bộ nhớ
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                        Điểm
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {submission.results.map((tc, index) => (
                                    <tr
                                        key={tc.testcaseId}
                                        className="border-b border-gray-200 dark:border-gray-700"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {tc.isHidden
                                                    ? `Test #${index + 1} (ẩn)`
                                                    : `Test #${index + 1}`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={tc.verdict || "PENDING"} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {tc.timeMs || "-"} ms
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {tc.memoryKb
                                                    ? (tc.memoryKb / 1024).toFixed(2)
                                                    : "-"}{" "}
                                                MB
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`font-medium ${
                                                    tc.verdict === "ACCEPTED"
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                }`}
                                            >
                                                {tc.score}/{tc.maxScore}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Actions */}
            <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                    Quay lại bài tập
                </Button>
                <Button className="flex-1" onClick={() => navigate("/")}>
                    Làm bài khác
                </Button>
            </div>
        </div>
    );
}
