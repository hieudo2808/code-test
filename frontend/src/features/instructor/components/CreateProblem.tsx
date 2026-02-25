import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardBody } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input, TextArea } from "~/components/ui/input";
import { CodeEditor } from "~/components/ui/CodeEditor";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import {
    problemService,
    CreateProblemRequest,
    UpdateProblemRequest,
} from "~/services/problemService";
import { languageService, Language } from "~/services/languageService";
import { toast } from "sonner";

interface CreateProblemProps {
    onNavigate: (page: string) => void;
    problemId?: string;
}

type TestcaseMode = "auto" | "manual";

interface Testcase {
    id?: string;
    input: string;
    output: string;
    mode: TestcaseMode;
    score: number;
    isHidden: boolean;
}

export function CreateProblem({ onNavigate, problemId }: CreateProblemProps) {
    const isEditMode = !!problemId;
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);

    // Basic Info
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [evaluationType, setEvaluationType] = useState<"EXACT" | "HEURISTIC" | "MANUAL">("EXACT");
    const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
    const [isPublic, setIsPublic] = useState(true);

    // Limits
    const [timeLimit, setTimeLimit] = useState(1.0);
    const [memoryLimit, setMemoryLimit] = useState(256);

    // Code
    const [solutionCode, setSolutionCode] = useState("");
    const [solutionLanguageId, setSolutionLanguageId] = useState(71); // Python
    const [scorerCode, setScorerCode] = useState("");
    const [scorerLanguageId, setScorerLanguageId] = useState(71); // Python

    // Languages
    const [languages, setLanguages] = useState<Language[]>([]);

    // Testcases
    const [testcases, setTestcases] = useState<Testcase[]>([]);
    const [deletedTestcaseIds, setDeletedTestcaseIds] = useState<string[]>([]);

    const maxScore = testcases.reduce((sum, tc) => sum + (tc.score || 0), 0);

    useEffect(() => {
        languageService.getLanguages().then(setLanguages).catch(console.error);
        if (isEditMode && problemId) {
            fetchProblemData(problemId);
        }
    }, [isEditMode, problemId]);

    const fetchProblemData = async (id: string) => {
        setIsLoading(true);
        try {
            const problem = await problemService.getProblem(id);
            const tcs = await problemService.getTestcases(id);

            // Access property safely. If 'description' exists use it, else 'problemDescription'
            // @ts-ignore
            const desc = problem.problemDescription || problem.description || "";

            setTitle(problem.title);
            setDescription(desc);
            setEvaluationType((problem.evaluationType as any) || "EXACT");
            setDifficulty((problem.difficulty as any) || "MEDIUM");
            setIsPublic(problem.isPublic);
            setTimeLimit(problem.timeLimit);
            setMemoryLimit(problem.memoryLimit);
            setSolutionCode(problem.solutionCode || "");
            setSolutionLanguageId(problem.solutionLanguageId || 71);
            setScorerCode(problem.scorerCode || "");
            setScorerLanguageId(problem.scorerLanguageId || 71);

            // Map testcases and fetch content from S3
            const testcasesWithContent = await Promise.all(
                tcs.map(async (tc) => {
                    let input = "";
                    let output = "";
                    try {
                        const content = await problemService.getTestcaseContent(tc.testcaseId);
                        input = content.input;
                        output = content.output;
                    } catch (e) {
                        console.warn("Failed to fetch testcase content:", tc.testcaseId, e);
                    }
                    return {
                        id: tc.testcaseId,
                        input,
                        output,
                        mode: "manual" as TestcaseMode,
                        score: tc.testcasePoint,
                        isHidden: tc.isHidden,
                    };
                })
            );
            setTestcases(testcasesWithContent);
        } catch (error) {
            console.error("Failed to fetch problem data:", error);
            // Handle error (notification?)
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTestcase = () => {
        setTestcases([
            ...testcases,
            {
                input: "",
                output: "",
                mode: "manual",
                score: 10,
                isHidden: false,
            },
        ]);
    };

    const handleRemoveTestcase = (index: number) => {
        const tc = testcases[index];
        if (tc.id) {
            setDeletedTestcaseIds([...deletedTestcaseIds, tc.id]);
        }
        setTestcases(testcases.filter((_, i) => i !== index));
    };

    const handleUpdateTestcase = (index: number, field: keyof Testcase, value: any) => {
        const newTestcases = [...testcases];
        newTestcases[index] = { ...newTestcases[index], [field]: value };
        setTestcases(newTestcases);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setIsSubmitting(true);
        try {
            // 1. Create/Update Problem
            let savedProblemId = problemId;

            if (isEditMode && problemId) {
                const updatePayload: UpdateProblemRequest = {
                    title,
                    problemDescription: description,
                    evaluationType,
                    difficulty,
                    isPublic,
                    timeLimit,
                    memoryLimit,
                    maxScore,
                    solutionCode,
                    solutionLanguageId,
                    scorerCode,
                    scorerLanguageId,
                };
                await problemService.updateProblem(problemId, updatePayload);
            } else {
                const createPayload: CreateProblemRequest = {
                    title,
                    slug: title.toLowerCase().replace(/ /g, "-") + "-" + Date.now(),
                    problemDescription: description,
                    evaluationType,
                    difficulty,
                    isPublic,
                    timeLimit,
                    memoryLimit,
                    maxScore,
                    solutionCode,
                    solutionLanguageId,
                    scorerCode,
                    scorerLanguageId,
                };
                const response = await problemService.createProblem(createPayload);
                // @ts-ignore
                savedProblemId = response.problemId || response.id;
            }

            if (!savedProblemId) throw new Error("Problem ID missing after save");

            // 2. Sync Testcases
            // Handle Deleted
            for (const deletedId of deletedTestcaseIds) {
                await problemService.deleteTestcase(deletedId);
            }

            // Handle Create/Update
            for (const tc of testcases) {
                if (tc.id) {
                    // Update existing
                    const formData = new FormData();
                    formData.append(
                        "request",
                        new Blob(
                            [
                                JSON.stringify({
                                    testcasePoint: tc.score,
                                    isHidden: tc.isHidden,
                                }),
                            ],
                            { type: "application/json" }
                        )
                    );

                    // Send updated input/output files
                    if (tc.input !== undefined) {
                        formData.append("input", new Blob([tc.input], { type: "text/plain" }));
                    }
                    if (tc.output !== undefined) {
                        formData.append("output", new Blob([tc.output], { type: "text/plain" }));
                    }

                    await problemService.updateTestcase(tc.id, formData);
                } else {
                    // Create new
                    const formData = new FormData();
                    formData.append(
                        "request",
                        new Blob(
                            [
                                JSON.stringify({
                                    testcasePoint: tc.score,
                                    isHidden: tc.isHidden,
                                    timeLimit,
                                    memoryLimit,
                                }),
                            ],
                            { type: "application/json" }
                        )
                    );

                    formData.append("input", new Blob([tc.input], { type: "text/plain" }));
                    if (tc.mode === "auto") {
                        formData.append("output", new Blob([""], { type: "text/plain" }));
                    } else {
                        formData.append("output", new Blob([tc.output], { type: "text/plain" }));
                    }

                    await problemService.createTestcase(savedProblemId, formData);
                }
            }

            // 3. Trigger Output Generation for ANY testcase marked as auto
            if (solutionCode && testcases.some((tc) => tc.mode === "auto")) {
                await problemService.generateOutputs(savedProblemId);
            }

            onNavigate("instructor-dashboard");
        } catch (error) {
            console.error("Failed to save problem:", error);
            toast.error("Failed to save problem. Check console for details.");
            isSubmittingRef.current = false;
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigate("instructor-dashboard")}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-(--text-primary)">
                            {isEditMode ? "Edit Problem" : "Create New Problem"}
                        </h1>
                        <p className="text-(--text-secondary)">
                            {isEditMode
                                ? "Update problem details and testcases"
                                : "Fill in the details below to create a new coding problem"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-(--text-primary)">
                                Problem Description
                            </h3>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <TextArea
                                label="Description (Markdown)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the problem statement, input/output format, constraints..."
                                rows={10}
                            />
                        </CardBody>
                    </Card>

                    {/* Evaluation & Code */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-(--text-primary)">
                                Evaluation & Solution
                            </h3>
                        </CardHeader>
                        <CardBody className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-(--text-secondary) block mb-1">
                                        Evaluation Type
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 bg-(--bg-secondary) border border-(--border-color) rounded-lg text-(--text-primary)"
                                        value={evaluationType}
                                        onChange={(e) => setEvaluationType(e.target.value as any)}
                                    >
                                        <option value="EXACT">Exact Match</option>
                                        <option value="HEURISTIC">Heuristic (Custom Scorer)</option>
                                        <option value="MANUAL">Manual Review</option>
                                    </select>
                                </div>
                            </div>

                            {/* Solution Code */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-sm font-medium text-(--text-secondary)">
                                        Solution Code (Optional)
                                    </label>
                                    <select
                                        className="px-2 py-1 text-sm bg-(--bg-secondary) border border-(--border-color) rounded-lg text-(--text-primary)"
                                        value={solutionLanguageId}
                                        onChange={(e) =>
                                            setSolutionLanguageId(Number(e.target.value))
                                        }
                                    >
                                        {languages.map((lang) => (
                                            <option key={lang.id} value={lang.id}>
                                                {lang.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <CodeEditor
                                    value={solutionCode}
                                    onChange={(value) => setSolutionCode(value)}
                                    placeholder="// Enter reference solution code here..."
                                    height="250px"
                                    className="mb-1"
                                    language={
                                        languages.find((l) => l.id === solutionLanguageId)
                                            ?.monacoLanguage || "python"
                                    }
                                />
                                <p className="text-xs text-(--text-tertiary) mt-1">
                                    Used for auto-generating outputs for testcases.
                                </p>
                            </div>

                            {/* Heuristic Scorer */}
                            {evaluationType === "HEURISTIC" && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-sm font-medium text-(--text-secondary)">
                                            Custom Scorer
                                        </label>
                                        <select
                                            className="px-2 py-1 text-sm bg-(--bg-secondary) border border-(--border-color) rounded-lg text-(--text-primary)"
                                            value={scorerLanguageId}
                                            onChange={(e) =>
                                                setScorerLanguageId(Number(e.target.value))
                                            }
                                        >
                                            {languages.map((lang) => (
                                                <option key={lang.id} value={lang.id}>
                                                    {lang.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <CodeEditor
                                        value={scorerCode}
                                        onChange={(value) => setScorerCode(value)}
                                        placeholder={`// Custom scorer logic...`}
                                        height="250px"
                                        className="mb-1"
                                        language={
                                            languages.find((l) => l.id === scorerLanguageId)
                                                ?.monacoLanguage || "python"
                                        }
                                    />
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Test Cases */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-(--text-primary)">
                                    Test Cases
                                </h3>
                                <Button size="sm" onClick={handleAddTestcase}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Test Case
                                </Button>
                            </div>
                        </CardHeader>
                        <CardBody className="space-y-6">
                            {testcases.map((tc, index) => (
                                <div
                                    key={index}
                                    className="p-4 bg-(--bg-secondary) rounded-lg border border-(--border-color) space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-(--text-primary)">
                                            Test Case #{index + 1}{" "}
                                            {tc.id && (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">
                                                    Existing
                                                </span>
                                            )}
                                        </h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            onClick={() => handleRemoveTestcase(index)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {tc.id ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <TextArea
                                                label="Input"
                                                value={tc.input}
                                                onChange={(e) =>
                                                    handleUpdateTestcase(
                                                        index,
                                                        "input",
                                                        e.target.value
                                                    )
                                                }
                                                rows={3}
                                            />
                                            <TextArea
                                                label="Expected Output"
                                                value={tc.output}
                                                onChange={(e) =>
                                                    handleUpdateTestcase(
                                                        index,
                                                        "output",
                                                        e.target.value
                                                    )
                                                }
                                                rows={3}
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <TextArea
                                                label="Input"
                                                value={tc.input}
                                                onChange={(e) =>
                                                    handleUpdateTestcase(
                                                        index,
                                                        "input",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Enter test case input..."
                                                rows={3}
                                            />
                                            {tc.mode === "manual" ? (
                                                <TextArea
                                                    label="Expected Output"
                                                    value={tc.output}
                                                    onChange={(e) =>
                                                        handleUpdateTestcase(
                                                            index,
                                                            "output",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Enter expected output..."
                                                    rows={3}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg h-full">
                                                    <p className="text-sm text-gray-500 text-center">
                                                        Output will be generated using Solution Code
                                                        on submit
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-6">
                                        {!tc.id && (
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        checked={tc.mode === "manual"}
                                                        onChange={() =>
                                                            handleUpdateTestcase(
                                                                index,
                                                                "mode",
                                                                "manual"
                                                            )
                                                        }
                                                        className="w-4 h-4 text-primary"
                                                    />
                                                    <span className="text-sm text-(--text-secondary)">
                                                        Manual Output
                                                    </span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        checked={tc.mode === "auto"}
                                                        onChange={() =>
                                                            handleUpdateTestcase(
                                                                index,
                                                                "mode",
                                                                "auto"
                                                            )
                                                        }
                                                        className="w-4 h-4 text-primary"
                                                    />
                                                    <span className="text-sm text-(--text-secondary)">
                                                        Auto-generate Output
                                                    </span>
                                                </label>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 ml-auto">
                                            <div className="w-24">
                                                <Input
                                                    label="Score"
                                                    type="number"
                                                    value={tc.score}
                                                    onChange={(e) =>
                                                        handleUpdateTestcase(
                                                            index,
                                                            "score",
                                                            parseFloat(e.target.value)
                                                        )
                                                    }
                                                    min={0}
                                                />
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer mt-6">
                                                <input
                                                    type="checkbox"
                                                    checked={!tc.isHidden}
                                                    onChange={(e) =>
                                                        handleUpdateTestcase(
                                                            index,
                                                            "isHidden",
                                                            !e.target.checked
                                                        )
                                                    }
                                                    className="w-4 h-4 text-primary rounded"
                                                />
                                                <span className="text-sm text-(--text-secondary)">
                                                    Visible to students
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                </div>

                {/* Right Column - Basic Info (Sticky) */}
                <div className="space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-(--text-primary)">
                                Basic Information
                            </h3>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <Input
                                label="Problem Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Two Sum"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-(--text-secondary) block mb-1">
                                        Difficulty
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 bg-(--bg-secondary) border border-(--border-color) rounded-lg text-(--text-primary)"
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value as any)}
                                    >
                                        <option value="EASY">Easy</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HARD">Hard</option>
                                    </select>
                                </div>
                                <div className="flex items-center mt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isPublic}
                                            onChange={(e) => setIsPublic(e.target.checked)}
                                            className="w-4 h-4 text-primary rounded"
                                        />
                                        <span className="text-sm text-(--text-secondary)">
                                            Public
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Time Limit (s)"
                                    type="number"
                                    value={timeLimit}
                                    onChange={(e) => setTimeLimit(parseFloat(e.target.value))}
                                    step={0.1}
                                    min={0.1}
                                />
                                <Input
                                    label="Memory Limit (MB)"
                                    type="number"
                                    value={memoryLimit}
                                    onChange={(e) => setMemoryLimit(parseInt(e.target.value))}
                                    min={1}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Max Score
                                </label>
                                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white font-semibold">
                                    {maxScore || 0}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-(--border-color)">
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => onNavigate("instructor-dashboard")}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        className="flex-1"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting && (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        )}
                                        {isEditMode ? "Save Changes" : "Create Problem"}
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
