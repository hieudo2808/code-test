import React, { useState } from "react";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { Button } from "../ui/Button";
import { DifficultyBadge, StatusBadge } from "../ui/Badge";
import { CodeEditor } from "../ui/CodeEditor";
import { Select } from "../ui/Input";
import { ArrowLeft, Clock, Database, Send, CheckCircle } from "lucide-react";
import { mockProblems, type SubmissionStatus } from "../../data/mockData";

interface ProblemDetailProps {
    problemId: string;
    onNavigate: (page: string, id?: string) => void;
}

export function ProblemDetail({ problemId, onNavigate }: ProblemDetailProps) {
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("python");
    const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const problem = mockProblems.find((p) => p.id === problemId);

    if (!problem) {
        return <div>Problem not found</div>;
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
                // Show result page after a delay
                setTimeout(() => {
                    onNavigate("submission-result", `sub-${Date.now()}`);
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
                        onClick={() => onNavigate("home")}
                        className="mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Problems
                    </Button>

                    <div className="flex items-center gap-4 mb-5">
                        <h2 className="text-[var(--text-primary)]">{problem.title}</h2>
                        <DifficultyBadge difficulty={problem.difficulty} />
                    </div>

                    <div className="flex items-center gap-8 text-sm text-[var(--text-secondary)]">
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
                        <h3 className="text-[var(--text-primary)]">Problem Description</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="prose prose-sm max-w-none text-[var(--text-primary)]">
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
                        <h3 className="text-[var(--text-primary)]">Input</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="prose prose-sm max-w-none text-[var(--text-primary)]">
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
                        <h3 className="text-[var(--text-primary)]">Output</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="prose prose-sm max-w-none text-[var(--text-primary)]">
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
                        <h3 className="text-[var(--text-primary)]">Constraints</h3>
                    </CardHeader>
                    <CardBody>
                        <ul className="space-y-2">
                            {problem.constraints.map((constraint, i) => (
                                <li
                                    key={i}
                                    className="text-[var(--text-primary)] flex items-start gap-2"
                                >
                                    <span className="text-[var(--primary-600)] mt-1">•</span>
                                    <code className="flex-1">{constraint}</code>
                                </li>
                            ))}
                        </ul>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-[var(--text-primary)]">Sample Test Cases</h3>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        {problem.sampleTestcases.map((testcase, i) => (
                            <div key={i}>
                                <h4 className="text-[var(--text-primary)] mb-3">Example {i + 1}</h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-[var(--text-secondary)] mb-2">
                                            Input:
                                        </p>
                                        <pre className="text-sm">{testcase.input}</pre>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[var(--text-secondary)] mb-2">
                                            Output:
                                        </p>
                                        <pre className="text-sm">{testcase.output}</pre>
                                    </div>
                                    {testcase.explanation && (
                                        <div>
                                            <p className="text-sm text-[var(--text-secondary)] mb-2">
                                                Explanation:
                                            </p>
                                            <p className="text-sm text-[var(--text-primary)]">
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
                <Card className="flex-shrink-0">
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
                        Run Code
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !code.trim()}
                        className="flex-1"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Submit
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
