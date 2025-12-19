import React, { useState } from "react";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, TextArea } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { mockProblems } from "../../data/mockData";

interface CreateContestProps {
    onNavigate: (page: string) => void;
}

interface SelectedProblem {
    problemId: string;
    score: number;
}

export function CreateContest({ onNavigate }: CreateContestProps) {
    const [contestName, setContestName] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [selectedProblems, setSelectedProblems] = useState<SelectedProblem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showProblemSelector, setShowProblemSelector] = useState(false);

    const filteredProblems = mockProblems.filter(
        (problem) =>
            problem.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !selectedProblems.some((sp) => sp.problemId === problem.id)
    );

    const addProblem = (problemId: string) => {
        setSelectedProblems([...selectedProblems, { problemId, score: 100 }]);
        setSearchQuery("");
        setShowProblemSelector(false);
    };

    const removeProblem = (problemId: string) => {
        setSelectedProblems(selectedProblems.filter((sp) => sp.problemId !== problemId));
    };

    const updateProblemScore = (problemId: string, score: number) => {
        setSelectedProblems(
            selectedProblems.map((sp) => (sp.problemId === problemId ? { ...sp, score } : sp))
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Contest created:", {
            contestName,
            description,
            startTime,
            endTime,
            selectedProblems,
        });
        onNavigate("instructor-dashboard");
    };

    const totalScore = selectedProblems.reduce((sum, sp) => sum + sp.score, 0);

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

                <h1 className="text-[var(--text-primary)] mb-2">Create Contest</h1>
                <p className="text-[var(--text-secondary)]">
                    Set up a new programming contest for your students.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <h3 className="text-[var(--text-primary)]">Contest Information</h3>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        <Input
                            label="Contest Name"
                            value={contestName}
                            onChange={(e) => setContestName(e.target.value)}
                            placeholder="e.g., Weekly Programming Challenge #10"
                            required
                        />

                        <TextArea
                            label="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide a description of the contest, its objectives, and any special rules..."
                            rows={4}
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Start Time"
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />

                            <Input
                                label="End Time"
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* Problem Selection */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-[var(--text-primary)]">Problems</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">
                                    {selectedProblems.length} problems selected | Total Score:{" "}
                                    {totalScore} points
                                </p>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setShowProblemSelector(!showProblemSelector)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Problem
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        {/* Problem Selector */}
                        {showProblemSelector && (
                            <div className="border border-[var(--border-color)] rounded-lg p-4 space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search problems..."
                                        className="w-full pl-10 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                                    />
                                </div>

                                <div className="max-h-64 overflow-y-auto space-y-2">
                                    {filteredProblems.map((problem) => (
                                        <div
                                            key={problem.id}
                                            className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
                                            onClick={() => addProblem(problem.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-[var(--text-primary)]">
                                                    {problem.title}
                                                </span>
                                                <Badge
                                                    variant={
                                                        problem.difficulty === "Easy"
                                                            ? "success"
                                                            : problem.difficulty === "Medium"
                                                            ? "warning"
                                                            : "error"
                                                    }
                                                >
                                                    {problem.difficulty}
                                                </Badge>
                                            </div>
                                            <Plus className="w-4 h-4 text-[var(--text-tertiary)]" />
                                        </div>
                                    ))}

                                    {filteredProblems.length === 0 && (
                                        <p className="text-center text-[var(--text-tertiary)] py-4">
                                            {searchQuery
                                                ? "No problems found"
                                                : "All problems have been added"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Selected Problems */}
                        {selectedProblems.length === 0 ? (
                            <div className="text-center py-8 text-[var(--text-tertiary)]">
                                <p>No problems selected yet</p>
                                <p className="text-sm mt-1">
                                    Click "Add Problem" to select problems for this contest
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedProblems.map((sp, index) => {
                                    const problem = mockProblems.find((p) => p.id === sp.problemId);
                                    if (!problem) return null;

                                    return (
                                        <div
                                            key={sp.problemId}
                                            className="flex items-center gap-4 p-4 border border-[var(--border-color)] rounded-lg"
                                        >
                                            <div className="flex items-center justify-center w-8 h-8 bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-primary)]">
                                                {String.fromCharCode(65 + index)}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[var(--text-primary)]">
                                                        {problem.title}
                                                    </span>
                                                    <Badge
                                                        variant={
                                                            problem.difficulty === "Easy"
                                                                ? "success"
                                                                : problem.difficulty === "Medium"
                                                                ? "warning"
                                                                : "error"
                                                        }
                                                    >
                                                        {problem.difficulty}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-[var(--text-tertiary)]">
                                                    Time: {problem.timeLimit}ms | Memory:{" "}
                                                    {problem.memoryLimit}MB
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Input
                                                    type="number"
                                                    value={sp.score.toString()}
                                                    onChange={(e) =>
                                                        updateProblemScore(
                                                            sp.problemId,
                                                            parseInt(e.target.value)
                                                        )
                                                    }
                                                    className="w-24"
                                                    placeholder="Score"
                                                />

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeProblem(sp.problemId)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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
                    <Button type="submit" disabled={selectedProblems.length === 0}>
                        Create Contest
                    </Button>
                </div>
            </form>
        </div>
    );
}
