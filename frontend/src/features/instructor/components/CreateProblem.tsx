import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardHeader, CardBody } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input, TextArea } from "~/components/ui/input";
import { CodeEditor } from "~/components/ui/CodeEditor";
import { ArrowLeft, Upload, RefreshCw, Eye, Loader2, Save, Trash2, CheckCircle2, FileText, Lock, Globe } from "lucide-react";
import {
    problemService,
    CreateProblemRequest,
    UpdateProblemRequest,
} from "~/services/problemService";
import { languageService, Language } from "~/services/languageService";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";

interface CreateProblemProps {
    onNavigate: (page: string) => void;
    problemId?: string;
}

interface Testcase {
    id: string;
    inputSizeKb: number;
    outputSizeKb: number;
    score: number;
    isHidden: boolean;
}

const TestcaseItem = React.memo<{
    index: number;
    tc: Testcase;
    onUpdate: (index: number, field: keyof Testcase, value: any) => void;
    onRemove: (id: string) => void;
    onView: (id: string) => void;
}>(({ index, tc, onUpdate, onRemove, onView }) => {
    return (
        <div className="flex items-center justify-between p-4 bg-(--bg-secondary) rounded-lg border border-(--border-color) hover:border-blue-500/50 transition-colors">
            <div className="flex items-center gap-6">
                <div className="flex flex-col">
                    <span className="font-semibold text-(--text-primary)">
                        Testcase #{index + 1}
                    </span>
                    <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs text-(--text-secondary)">
                            IN: {tc.inputSizeKb || 0} KB
                        </Badge>
                        <Badge variant="outline" className="text-xs text-(--text-secondary)">
                            OUT: {tc.outputSizeKb || 0} KB
                        </Badge>
                        {tc.isHidden ? (
                            <Badge variant="secondary" className="text-xs flex items-center gap-1"><Lock className="w-3 h-3"/> Hidden</Badge>
                        ) : (
                            <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><Globe className="w-3 h-3"/> Public</Badge>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-24">
                    <Input
                        label="Score"
                        type="number"
                        value={tc.score}
                        onChange={(e) => onUpdate(index, "score", parseFloat(e.target.value))}
                        min={0}
                    />
                </div>
                <div className="flex flex-col justify-center h-full mt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={tc.isHidden}
                            onChange={(e) => onUpdate(index, "isHidden", e.target.checked)}
                            className="w-4 h-4 text-primary rounded"
                        />
                        <span className="text-sm text-(--text-secondary)">Hidden</span>
                    </label>
                </div>
                <div className="flex gap-2 mt-6">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onView(tc.id)}
                        title="View preview"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => onRemove(tc.id)}
                        title="Delete testcase"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
});

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
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // View Modal
    const [viewData, setViewData] = useState<{ isOpen: boolean; input: string; output: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const maxScore = testcases.reduce((sum, tc) => sum + (tc.score || 0), 0);

    const refreshTestcases = useCallback(async () => {
        if (!problemId) return;
        try {
            const tcs = await problemService.getTestcases(problemId);
            const mapped = tcs.map((tc: any) => ({
                id: tc.testcaseId,
                inputSizeKb: tc.inputSizeKb,
                outputSizeKb: tc.outputSizeKb,
                score: tc.testcasePoint,
                isHidden: tc.isHidden,
            }));
            setTestcases(mapped);
        } catch (e) {
            console.error("Failed to refresh testcases", e);
        }
    }, [problemId]);

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

            await refreshTestcases();
        } catch (error) {
            console.error("Failed to fetch problem data:", error);
            toast.error("Failed to load problem data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateTestcase = useCallback((index: number, field: keyof Testcase, value: any) => {
        setTestcases((prev) => {
            const newTestcases = [...prev];
            newTestcases[index] = { ...newTestcases[index], [field]: value };
            return newTestcases;
        });
    }, []);

    const handleRemoveTestcase = async (id: string) => {
        if (confirm("Are you sure you want to delete this testcase?")) {
            try {
                await problemService.deleteTestcase(id);
                toast.success("Testcase deleted");
                await refreshTestcases();
            } catch (e) {
                toast.error("Failed to delete testcase");
            }
        }
    };

    const handleViewTestcase = async (id: string) => {
        try {
            const content = await problemService.getTestcaseContent(id);
            // The backend returns the full content, but typically preview handles small chunks.
            // If the content is huge, we slice it here (though in a real scenario backend should slice it, we will just slice it here for safety against rendering massive strings).
            const MAX_LENGTH = 2000;
            const inputPreview = content.input.length > MAX_LENGTH 
                ? content.input.slice(0, MAX_LENGTH) + "\n... (truncated)" 
                : content.input;
            const outputPreview = content.output.length > MAX_LENGTH 
                ? content.output.slice(0, MAX_LENGTH) + "\n... (truncated)" 
                : content.output;
            
            setViewData({
                isOpen: true,
                input: inputPreview,
                output: outputPreview
            });
        } catch (e) {
            toast.error("Failed to load testcase preview");
        }
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (!problemId) return;

        const files = Array.from(e.target.files);
        setIsUploading(true);
        toast.info(`Uploading ${files.length} input files...`);

        try {
            await problemService.bulkUploadInputs(problemId, files);
            toast.success("Files uploaded successfully. Output generation started in background.");
            await refreshTestcases();
        } catch (error) {
            toast.error("Failed to bulk upload testcases");
            console.error(error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleGenerateOutputs = async () => {
        if (!problemId) return;
        setIsGenerating(true);
        toast.info("Triggered output generation...");
        try {
            await problemService.generateOutputs(problemId);
            toast.success("Output generation queued successfully");
        } catch (e) {
            toast.error("Failed to queue output generation");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveTestcasesMetadata = async () => {
        try {
            // Update all testcase metadata (score, isHidden) iteratively
            for (const tc of testcases) {
                const formData = new FormData();
                formData.append(
                    "request",
                    new Blob(
                        [JSON.stringify({ testcasePoint: tc.score, isHidden: tc.isHidden })],
                        { type: "application/json" }
                    )
                );
                await problemService.updateTestcase(tc.id, formData);
            }
            toast.success("Testcase settings saved");
            await refreshTestcases();
        } catch (e) {
            toast.error("Failed to save some testcases metadata");
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setIsSubmitting(true);
        try {
            if (isEditMode && problemId) {
                const updatePayload: UpdateProblemRequest = {
                    title,
                    problemDescription: description,
                    evaluationType,
                    difficulty,
                    isPublic,
                    timeLimit,
                    memoryLimit,
                    maxScore, // This might not be accurate if we didn't save testcases metadata, but backend calculates it on testcase update anyway
                    solutionCode,
                    solutionLanguageId,
                    scorerCode,
                    scorerLanguageId,
                };
                await problemService.updateProblem(problemId, updatePayload);
                toast.success("Problem updated successfully");
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
                    maxScore: 0,
                    solutionCode,
                    solutionLanguageId,
                    scorerCode,
                    scorerLanguageId,
                };
                const response = await problemService.createProblem(createPayload);
                // @ts-ignore
                const savedProblemId = response.problemId || response.id;
                toast.success("Problem created! You can now upload testcases.");
                onNavigate(`instructor-dashboard`); // Or maybe redirect to edit mode: `edit-problem/${savedProblemId}` (Depends on router which we don't have direct access, returning to dashboard is safe)
            }
        } catch (error) {
            console.error("Failed to save problem:", error);
            toast.error("Failed to save problem. Check console for details.");
        } finally {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
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
                                ? "Update problem details and manage testcases"
                                : "Fill in the details below. Save the problem first to add testcases."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
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

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-sm font-medium text-(--text-secondary)">
                                        Solution Code (Required for auto-generating outputs)
                                    </label>
                                    <select
                                        className="px-2 py-1 text-sm bg-(--bg-secondary) border border-(--border-color) rounded-lg text-(--text-primary)"
                                        value={solutionLanguageId}
                                        onChange={(e) => setSolutionLanguageId(Number(e.target.value))}
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
                            </div>

                            {evaluationType === "HEURISTIC" && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-sm font-medium text-(--text-secondary)">
                                            Custom Scorer Code
                                        </label>
                                        <select
                                            className="px-2 py-1 text-sm bg-(--bg-secondary) border border-(--border-color) rounded-lg text-(--text-primary)"
                                            value={scorerLanguageId}
                                            onChange={(e) => setScorerLanguageId(Number(e.target.value))}
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

                    {/* Test Cases Panel */}
                    <Card className={!isEditMode ? "opacity-50 pointer-events-none" : ""}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-(--text-primary)">
                                        Test Cases
                                    </h3>
                                    {!isEditMode && (
                                        <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                                            Please create and save the problem first before managing testcases.
                                        </p>
                                    )}
                                </div>
                                {isEditMode && (
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            multiple
                                            accept=".in,.txt"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleBulkUpload}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleGenerateOutputs()}
                                            disabled={isGenerating}
                                        >
                                            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                            Regenerate Outputs
                                        </Button>
                                        <Button 
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                        >
                                            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                            Upload Inputs
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        {isEditMode && (
                            <CardBody className="space-y-4">
                                {testcases.length === 0 ? (
                                    <div className="text-center py-10 border-2 border-dashed border-(--border-color) rounded-lg">
                                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <h3 className="text-lg font-medium text-(--text-primary)">No Testcases Found</h3>
                                        <p className="text-sm text-(--text-secondary) mb-4">Upload your `.in` or `.txt` input files to get started.</p>
                                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                            Select Files
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-end mb-2">
                                            <Button variant="secondary" size="sm" onClick={handleSaveTestcasesMetadata}>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Settings
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {testcases.map((tc, index) => (
                                                <TestcaseItem
                                                    key={tc.id}
                                                    index={index}
                                                    tc={tc}
                                                    onUpdate={handleUpdateTestcase}
                                                    onRemove={handleRemoveTestcase}
                                                    onView={handleViewTestcase}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </CardBody>
                        )}
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
                                    {isEditMode ? (maxScore || 0) : "Auto-calculated from testcases"}
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
                                        {isEditMode ? "Save Problem Details" : "Create Problem"}
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Testcase Preview Modal */}
            <Dialog open={!!viewData} onOpenChange={(open) => !open && setViewData(null)}>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Testcase Preview</DialogTitle>
                    </DialogHeader>
                    {viewData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto mt-4 p-1 flex-1">
                            <div>
                                <h4 className="font-semibold text-sm mb-2 text-(--text-secondary)">Input (first 2KB)</h4>
                                <pre className="bg-(--bg-secondary) p-4 rounded-lg overflow-auto text-xs font-mono h-[500px] border border-(--border-color) whitespace-pre-wrap">
                                    {viewData.input || "No input"}
                                </pre>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm mb-2 text-(--text-secondary)">Output (first 2KB)</h4>
                                <pre className="bg-(--bg-secondary) p-4 rounded-lg overflow-auto text-xs font-mono h-[500px] border border-(--border-color) whitespace-pre-wrap">
                                    {viewData.output || "No output (or still generating)"}
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
