import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { DifficultyBadge, StatusBadge } from "~/components/ui/Badge";
import { CodeEditor } from "~/components/ui/CodeEditor";
import { Select } from "~/components/ui/Input";
import { ArrowLeft, Clock, Database, Send, CheckCircle } from "lucide-react";
import { mockProblems, type SubmissionStatus } from "~/lib/mock-data";

export function ProblemDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("python");
    const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const problem = mockProblems.find((p) => p.id === id);

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

    const handleSubmit = () => {
        setIsSubmitting(true);
        setSubmissionStatus("Pending");

        // Simulate submission
        setTimeout(() => {
            const statuses: SubmissionStatus[] = [
                "Accepted",
                "Wrong Answer",
                "Time Limit Exceeded",
            ];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            setSubmissionStatus(randomStatus);
            setIsSubmitting(false);

            if (randomStatus === "Accepted") {
                setTimeout(() => {
                    navigate(`/submissions/sub-${Date.now()}`);
                }, 1000);
            }
        }, 2000);
    };

    const languages = [
        { value: "python", label: "Python 3" },
        { value: "cpp", label: "C++17" },
        { value: "java", label: "Java 11" },
        { value: "javascript", label: "JavaScript" },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
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
                        <DifficultyBadge difficulty={problem.difficulty} />
                    </div>

                    <div className="flex items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Time: {problem.timeLimit}ms</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            <span>Memory: {problem.memoryLimit}MB</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Acceptance: {problem.acceptanceRate}%</span>
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
                            {problem.description.split("\n").map((para, i) => (
                                <p key={i} className="mb-3 leading-relaxed">
                                    {para}
                                </p>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-gray-900 dark:text-white font-semibold">Input</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                            {problem.inputDescription.split("\n").map((para, i) => (
                                <p key={i} className="mb-2">
                                    {para}
                                </p>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-gray-900 dark:text-white font-semibold">Output</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                            {problem.outputDescription.split("\n").map((para, i) => (
                                <p key={i} className="mb-2">
                                    {para}
                                </p>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-gray-900 dark:text-white font-semibold">Ràng buộc</h3>
                    </CardHeader>
                    <CardBody>
                        <ul className="space-y-2">
                            {problem.constraints.map((constraint, i) => (
                                <li
                                    key={i}
                                    className="text-gray-700 dark:text-gray-300 flex items-start gap-2"
                                >
                                    <span className="text-red-500 mt-1">•</span>
                                    <code className="flex-1">{constraint}</code>
                                </li>
                            ))}
                        </ul>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-gray-900 dark:text-white font-semibold">Ví dụ mẫu</h3>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        {problem.sampleTestcases.map((testcase, i) => (
                            <div key={i}>
                                <h4 className="text-gray-900 dark:text-white font-medium mb-3">
                                    Ví dụ {i + 1}
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                            Input:
                                        </p>
                                        <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                            {testcase.input}
                                        </pre>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                            Output:
                                        </p>
                                        <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                            {testcase.output}
                                        </pre>
                                    </div>
                                    {testcase.explanation && (
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                                Giải thích:
                                            </p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {testcase.explanation}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardBody>
                </Card>
            </div>

            {/* Code Editor */}
            <div className="flex flex-col space-y-4">
                <Card className="shrink-0">
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <Select
                                options={languages}
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-48"
                            />
                            {submissionStatus && <StatusBadge status={submissionStatus} />}
                        </div>
                    </CardBody>
                </Card>

                <div className="flex-1 min-h-0">
                    <CodeEditor value={code} onChange={setCode} language={language} />
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1">
                        Chạy thử
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !code.trim()}
                        className="flex-1"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Đang nộp...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Nộp bài
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
