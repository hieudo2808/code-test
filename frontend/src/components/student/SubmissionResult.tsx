import React from "react";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/Badge";
import { ArrowLeft, CheckCircle, XCircle, Clock, Database } from "lucide-react";
import type { SubmissionStatus } from "../../data/mockData";

interface SubmissionResultProps {
    submissionId: string;
    onNavigate: (page: string, id?: string) => void;
}

export function SubmissionResult({ submissionId, onNavigate }: SubmissionResultProps) {
    // Mock submission data
    const submission = {
        id: submissionId,
        problemTitle: "Two Sum",
        language: "Python 3",
        status: "Accepted" as SubmissionStatus,
        score: 100,
        totalScore: 100,
        submittedAt: new Date(),
        executionTime: 45,
        memoryUsed: 14.2,
        testcaseResults: [
            { id: 1, status: "Accepted" as SubmissionStatus, time: 12, memory: 14.1, score: 20 },
            { id: 2, status: "Accepted" as SubmissionStatus, time: 15, memory: 14.2, score: 20 },
            { id: 3, status: "Accepted" as SubmissionStatus, time: 10, memory: 14.0, score: 20 },
            { id: 4, status: "Accepted" as SubmissionStatus, time: 8, memory: 13.9, score: 20 },
            { id: 5, status: "Accepted" as SubmissionStatus, time: 13, memory: 14.1, score: 20 },
        ],
    };

    const passedTests = submission.testcaseResults.filter((t) => t.status === "Accepted").length;
    const totalTests = submission.testcaseResults.length;

    return (
        <div className="space-y-6">
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate("home")}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Problems
                </Button>

                <h1 className="text-[var(--text-primary)] mb-2">Submission Result</h1>
                <p className="text-[var(--text-secondary)]">{submission.problemTitle}</p>
            </div>

            {/* Overall Result */}
            <Card>
                <CardBody>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-[var(--text-tertiary)] text-sm mb-1">Status</p>
                                <StatusBadge status={submission.status} />
                            </div>
                            <div>
                                <p className="text-[var(--text-tertiary)] text-sm mb-1">Language</p>
                                <p className="text-[var(--text-primary)]">{submission.language}</p>
                            </div>
                            <div>
                                <p className="text-[var(--text-tertiary)] text-sm mb-1">Score</p>
                                <p className="text-[var(--text-primary)]">
                                    {submission.score} / {submission.totalScore}
                                </p>
                            </div>
                            <div>
                                <p className="text-[var(--text-tertiary)] text-sm mb-1">
                                    Test Cases
                                </p>
                                <p className="text-[var(--text-primary)]">
                                    {passedTests} / {totalTests} passed
                                </p>
                            </div>
                        </div>

                        {submission.status === "Accepted" && (
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[var(--text-tertiary)] text-sm">
                                    Execution Time
                                </p>
                                <h3 className="text-[var(--text-primary)]">
                                    {submission.executionTime}ms
                                </h3>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-[var(--text-tertiary)] text-sm">Memory Used</p>
                                <h3 className="text-[var(--text-primary)]">
                                    {submission.memoryUsed}MB
                                </h3>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Test Case Results */}
            <Card>
                <CardHeader>
                    <h3 className="text-[var(--text-primary)]">Test Case Results</h3>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border-color)]">
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Test Case
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Time (ms)
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Memory (MB)
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Score
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {submission.testcaseResults.map((result) => (
                                <tr
                                    key={result.id}
                                    className="border-b border-[var(--border-color)]"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {result.status === "Accepted" ? (
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-600" />
                                            )}
                                            <span className="text-[var(--text-primary)]">
                                                Test Case #{result.id}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={result.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[var(--text-secondary)]">
                                            {result.time}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[var(--text-secondary)]">
                                            {result.memory}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[var(--text-primary)]">
                                            {result.score}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => onNavigate("home")}>
                    Back to Problems
                </Button>
                <Button onClick={() => onNavigate("problem-detail", "p1")}>
                    Try Another Problem
                </Button>
            </div>
        </div>
    );
}
