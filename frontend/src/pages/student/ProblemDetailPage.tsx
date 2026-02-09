import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { DifficultyBadge, StatusBadge } from "~/components/ui/badge";
import { CodeEditor } from "~/components/ui/CodeEditor";
import { Select } from "~/components/ui/input";
import { ArrowLeft, Clock, Database, Send, Loader2 } from "lucide-react";
import { problemService, type Problem } from "~/services/problemService";
import { languageService, type Language } from "~/services/languageService";
import { submissionService } from "~/services/submissionService";

type SubmissionStatus = "PENDING" | "JUDGING" | "DONE" | "ERROR";

export function ProblemDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [problem, setProblem] = useState<Problem | null>(null);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);

    const [code, setCode] = useState("");
    const [languageId, setLanguageId] = useState<number>(0);
    const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (!id) return;
            try {
                setLoading(true);
                const [problemData, languagesData] = await Promise.all([
                    problemService.getProblem(id),
                    languageService.getLanguages(),
                ]);
                setProblem(problemData);
                setLanguages(languagesData);
                if (languagesData.length > 0) {
                    setLanguageId(languagesData[0].id);
                }
            } catch (error) {
                console.error("Error fetching problem:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const handleSubmit = async () => {
        if (!problem || !code.trim()) return;

        try {
            setIsSubmitting(true);
            setSubmissionStatus("PENDING");

            const submission = await submissionService.submit({
                problemId: problem.problemId,
                languageId,
                sourceCode: code,
            });

            // Poll for result
            const result = await submissionService.pollSubmission(submission.submissionId);
            setSubmissionStatus(result.status);

            if (result.status === "DONE") {
                setTimeout(() => {
                    navigate(`/submissions/${submission.submissionId}`);
                }, 500);
            }
        } catch (error) {
            console.error("Error submitting:", error);
            setSubmissionStatus("ERROR");
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedLanguage = languages.find((l) => l.id === languageId);

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
                            {problem.description?.split("\n").map((para, i) => (
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
                <Card className="shrink-0">
                    <CardBody>
                        <div className="flex items-center justify-between">
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
                        </div>
                    </CardBody>
                </Card>

                <div className="flex-1 min-h-0">
                    <CodeEditor
                        value={code}
                        onChange={setCode}
                        language={selectedLanguage?.monacoLanguage || "python"}
                    />
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
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
