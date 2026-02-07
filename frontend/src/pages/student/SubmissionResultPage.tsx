import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { StatusBadge } from "~/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, Clock, Database, Trophy } from "lucide-react";
import type { SubmissionStatus } from "~/lib/mock-data";

export function SubmissionResultPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Mock submission result
    const submission = {
        id: id,
        problemTitle: "Two Sum",
        language: "Python 3",
        status: "Accepted" as SubmissionStatus,
        score: 100,
        submittedAt: new Date(),
        executionTime: 45,
        memoryUsed: 12.5,
        testcaseResults: [
            {
                testcaseId: 1,
                status: "Accepted" as SubmissionStatus,
                executionTime: 10,
                memoryUsed: 12,
                score: 20,
            },
            {
                testcaseId: 2,
                status: "Accepted" as SubmissionStatus,
                executionTime: 15,
                memoryUsed: 12.2,
                score: 20,
            },
            {
                testcaseId: 3,
                status: "Accepted" as SubmissionStatus,
                executionTime: 8,
                memoryUsed: 12.1,
                score: 20,
            },
            {
                testcaseId: 4,
                status: "Accepted" as SubmissionStatus,
                executionTime: 12,
                memoryUsed: 12.5,
                score: 20,
            },
            {
                testcaseId: 5,
                status: "Accepted" as SubmissionStatus,
                executionTime: 45,
                memoryUsed: 12.3,
                score: 20,
            },
        ],
    };

    const isAccepted = submission.status === "Accepted";

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => <Navigate to="/" />}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Trở về danh sách
                </Button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-gray-900 dark:text-white text-2xl font-bold mb-2">
                            Kết quả bài nộp
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Bài tập: {submission.problemTitle} • {submission.language}
                        </p>
                    </div>
                    <StatusBadge status={submission.status} />
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
                                {isAccepted ? "Chính xác!" : "Sai kết quả"}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                {isAccepted
                                    ? "Chúc mừng! Bài làm của bạn đã được chấp nhận."
                                    : "Bài làm của bạn chưa chính xác. Hãy thử lại!"}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {submission.score}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">điểm</div>
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
                                    {submission.executionTime} ms
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
                                    {submission.memoryUsed} MB
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
                                    {
                                        submission.testcaseResults.filter(
                                            (t) => t.status === "Accepted"
                                        ).length
                                    }
                                    /{submission.testcaseResults.length}
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Test Case Results */}
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
                            {submission.testcaseResults.map((tc) => (
                                <tr
                                    key={tc.testcaseId}
                                    className="border-b border-gray-200 dark:border-gray-700"
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-gray-900 dark:text-white font-medium">
                                            Test #{tc.testcaseId}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={tc.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {tc.executionTime} ms
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {tc.memoryUsed} MB
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`font-medium ${
                                                tc.status === "Accepted"
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                        >
                                            {tc.score}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                    Quay lại bài tập
                </Button>
                <Button className="flex-1" onClick={() => <Navigate to="/" />}>
                    Làm bài khác
                </Button>
            </div>
        </div>
    );
}
