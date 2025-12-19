import React, { useState } from "react";
import { Card, CardHeader, CardBody } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Input, TextArea, Select } from "~/components/ui/Input";
import { CodeEditor } from "~/components/ui/CodeEditor";
import { ArrowLeft, Plus, Trash2, AlertTriangle, Check } from "lucide-react";

interface CreateProblemProps {
    onNavigate: (page: string) => void;
}

type TestcaseMode = "auto" | "manual";

interface Testcase {
    id: string;
    mode: TestcaseMode;
    input: string;
    output: string;
    referenceCode: string;
    timeLimit: number;
    memoryLimit: number;
    score: number;
    includeInScoring: boolean;
    validationError?: string;
}

export function CreateProblem({ onNavigate }: CreateProblemProps) {
    const [problemName, setProblemName] = useState("");
    const [description, setDescription] = useState("");
    const [timeLimit, setTimeLimit] = useState("1000");
    const [memoryLimit, setMemoryLimit] = useState("256");
    const [testcases, setTestcases] = useState<Testcase[]>([
        {
            id: "1",
            mode: "manual",
            input: "",
            output: "",
            referenceCode: "",
            timeLimit: 1000,
            memoryLimit: 256,
            score: 100,
            includeInScoring: true,
        },
    ]);

    const addTestcase = () => {
        const newTestcase: Testcase = {
            id: Date.now().toString(),
            mode: "manual",
            input: "",
            output: "",
            referenceCode: "",
            timeLimit: parseInt(timeLimit),
            memoryLimit: parseInt(memoryLimit),
            score: 100,
            includeInScoring: true,
        };
        setTestcases([...testcases, newTestcase]);
    };

    const removeTestcase = (id: string) => {
        setTestcases(testcases.filter((tc) => tc.id !== id));
    };

    const updateTestcase = (id: string, updates: Partial<Testcase>) => {
        setTestcases(testcases.map((tc) => (tc.id === id ? { ...tc, ...updates } : tc)));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validate and submit
        console.log("Problem created:", { problemName, description, testcases });
        onNavigate("instructor-dashboard");
    };

    const totalScore = testcases
        .filter((tc) => tc.includeInScoring)
        .reduce((sum, tc) => sum + tc.score, 0);

    return (
        <div className="space-y-6">
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate("instructor-dashboard")}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>

                <h1 className="text-[var(--text-primary)] mb-2">Create Problem</h1>
                <p className="text-[var(--text-secondary)]">
                    Define your problem and configure test cases.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <h3 className="text-[var(--text-primary)]">Basic Information</h3>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        <Input
                            label="Problem Name"
                            value={problemName}
                            onChange={(e) => setProblemName(e.target.value)}
                            placeholder="e.g., Two Sum"
                            required
                        />

                        <TextArea
                            label="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide a detailed problem description. You can use **bold**, UPPERCASE, and `code` formatting."
                            rows={8}
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Time Limit (ms)"
                                type="number"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(e.target.value)}
                                required
                            />

                            <Input
                                label="Memory Limit (MB)"
                                type="number"
                                value={memoryLimit}
                                onChange={(e) => setMemoryLimit(e.target.value)}
                                required
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* Test Cases */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-[var(--text-primary)]">Test Cases</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">
                                    Total Score: {totalScore} points
                                </p>
                            </div>
                            <Button type="button" size="sm" onClick={addTestcase}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Test Case
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className="space-y-6">
                        {testcases.map((testcase, index) => (
                            <div
                                key={testcase.id}
                                className="border border-[var(--border-color)] rounded-lg p-4 space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[var(--text-primary)]">
                                        Test Case {index + 1}
                                    </h4>
                                    {testcases.length > 1 && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeTestcase(testcase.id)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {/* Mode Selection */}
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`mode-${testcase.id}`}
                                                checked={testcase.mode === "manual"}
                                                onChange={() =>
                                                    updateTestcase(testcase.id, { mode: "manual" })
                                                }
                                                className="w-4 h-4 text-[var(--primary-600)]"
                                            />
                                            <span className="text-[var(--text-primary)]">
                                                Manual Input/Output
                                            </span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={`mode-${testcase.id}`}
                                                checked={testcase.mode === "auto"}
                                                onChange={() =>
                                                    updateTestcase(testcase.id, { mode: "auto" })
                                                }
                                                className="w-4 h-4 text-[var(--primary-600)]"
                                            />
                                            <span className="text-[var(--text-primary)]">
                                                Auto-generate Output
                                            </span>
                                        </label>
                                    </div>

                                    {/* Input */}
                                    <TextArea
                                        label="Input"
                                        value={testcase.input}
                                        onChange={(e) =>
                                            updateTestcase(testcase.id, { input: e.target.value })
                                        }
                                        placeholder="Enter test input..."
                                        rows={4}
                                    />

                                    {/* Output or Reference Code */}
                                    {testcase.mode === "manual" ? (
                                        <TextArea
                                            label="Expected Output"
                                            value={testcase.output}
                                            onChange={(e) =>
                                                updateTestcase(testcase.id, {
                                                    output: e.target.value,
                                                })
                                            }
                                            placeholder="Enter expected output..."
                                            rows={4}
                                        />
                                    ) : (
                                        <div>
                                            <label className="block text-sm mb-2 text-[var(--text-primary)]">
                                                Reference Solution
                                            </label>
                                            <CodeEditor
                                                value={testcase.referenceCode}
                                                onChange={(value) =>
                                                    updateTestcase(testcase.id, {
                                                        referenceCode: value,
                                                    })
                                                }
                                                placeholder="// Write reference solution to auto-generate output"
                                                className="mb-2"
                                            />
                                            {testcase.validationError && (
                                                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                                    <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                        {testcase.validationError}
                                                    </p>
                                                </div>
                                            )}
                                            {testcase.output && (
                                                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-sm text-green-800 dark:text-green-200 mb-1">
                                                            Output generated successfully
                                                        </p>
                                                        <pre className="text-xs text-green-700 dark:text-green-300">
                                                            {testcase.output}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Limits and Score */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Input
                                            label="Time Limit (ms)"
                                            type="number"
                                            value={testcase.timeLimit.toString()}
                                            onChange={(e) =>
                                                updateTestcase(testcase.id, {
                                                    timeLimit: parseInt(e.target.value),
                                                })
                                            }
                                        />

                                        <Input
                                            label="Memory Limit (MB)"
                                            type="number"
                                            value={testcase.memoryLimit.toString()}
                                            onChange={(e) =>
                                                updateTestcase(testcase.id, {
                                                    memoryLimit: parseInt(e.target.value),
                                                })
                                            }
                                        />

                                        <Input
                                            label="Score"
                                            type="number"
                                            value={testcase.score.toString()}
                                            onChange={(e) =>
                                                updateTestcase(testcase.id, {
                                                    score: parseInt(e.target.value),
                                                })
                                            }
                                        />

                                        <div className="flex items-end">
                                            <label className="flex items-center gap-2 cursor-pointer pb-2">
                                                <input
                                                    type="checkbox"
                                                    checked={testcase.includeInScoring}
                                                    onChange={(e) =>
                                                        updateTestcase(testcase.id, {
                                                            includeInScoring: e.target.checked,
                                                        })
                                                    }
                                                    className="w-4 h-4 rounded text-[var(--primary-600)]"
                                                />
                                                <span className="text-sm text-[var(--text-primary)]">
                                                    Include in scoring
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardBody>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onNavigate("instructor-dashboard")}
                    >
                        Cancel
                    </Button>
                    <Button type="submit">Create Problem</Button>
                </div>
            </form>
        </div>
    );
}
