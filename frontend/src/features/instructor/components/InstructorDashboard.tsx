import React, { useState } from "react";
import { Card, CardHeader, CardBody } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { FileText, Trophy, Users, TrendingUp, Plus, Edit, Trash2 } from "lucide-react";
import { Modal } from "~/components/ui/Modal";

interface InstructorDashboardProps {
    onNavigate: (page: string) => void;
}

export function InstructorDashboard({ onNavigate }: InstructorDashboardProps) {
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        type: string;
        id: string;
    } | null>(null);

    const myProblems = [
        {
            id: "p1",
            title: "Array Rotation",
            difficulty: "Easy",
            submissions: 145,
            acceptanceRate: 67.5,
        },
        {
            id: "p2",
            title: "Graph Traversal",
            difficulty: "Medium",
            submissions: 89,
            acceptanceRate: 42.3,
        },
        {
            id: "p3",
            title: "Dynamic Programming Challenge",
            difficulty: "Hard",
            submissions: 34,
            acceptanceRate: 28.1,
        },
    ];

    const myContests = [
        {
            id: "c1",
            name: "Beginner Practice Round",
            status: "finished",
            participants: 234,
            problems: 4,
        },
        {
            id: "c2",
            name: "Weekly Challenge #5",
            status: "ongoing",
            participants: 156,
            problems: 3,
        },
        {
            id: "c3",
            name: "Advanced Algorithms Test",
            status: "upcoming",
            participants: 0,
            problems: 5,
        },
    ];

    const handleDelete = () => {
        // Handle delete logic
        setDeleteModal(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[var(--text-primary)] mb-2">Instructor Dashboard</h1>
                    <p className="text-[var(--text-secondary)]">
                        Manage your problems, contests, and track student performance.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => onNavigate("create-problem")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Problem
                    </Button>
                    <Button onClick={() => onNavigate("create-contest")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Contest
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[var(--text-tertiary)] text-sm">
                                    Total Problems
                                </p>
                                <h2 className="text-[var(--text-primary)] mt-1">12</h2>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[var(--text-tertiary)] text-sm">
                                    Active Contests
                                </p>
                                <h2 className="text-[var(--text-primary)] mt-1">3</h2>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[var(--text-tertiary)] text-sm">
                                    Total Students
                                </p>
                                <h2 className="text-[var(--text-primary)] mt-1">234</h2>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[var(--text-tertiary)] text-sm">
                                    Avg Acceptance
                                </p>
                                <h2 className="text-[var(--text-primary)] mt-1">45.9%</h2>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* My Problems */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h3 className="text-[var(--text-primary)]">My Problems</h3>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onNavigate("create-problem")}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New
                        </Button>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border-color)]">
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Title
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Difficulty
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Submissions
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Acceptance
                                </th>
                                <th className="px-6 py-3 text-right text-xs text-[var(--text-tertiary)] uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {myProblems.map((problem) => (
                                <tr
                                    key={problem.id}
                                    className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-[var(--text-primary)]">
                                            {problem.title}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
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
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[var(--text-secondary)]">
                                            {problem.submissions}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[var(--text-secondary)]">
                                            {problem.acceptanceRate}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button size="sm" variant="ghost">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setDeleteModal({
                                                        isOpen: true,
                                                        type: "problem",
                                                        id: problem.id,
                                                    })
                                                }
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* My Contests */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h3 className="text-[var(--text-primary)]">My Contests</h3>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onNavigate("create-contest")}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New
                        </Button>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border-color)]">
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Problems
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Participants
                                </th>
                                <th className="px-6 py-3 text-right text-xs text-[var(--text-tertiary)] uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {myContests.map((contest) => (
                                <tr
                                    key={contest.id}
                                    className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <span className="text-[var(--text-primary)]">
                                            {contest.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge
                                            variant={
                                                contest.status === "ongoing"
                                                    ? "success"
                                                    : contest.status === "upcoming"
                                                    ? "info"
                                                    : "default"
                                            }
                                        >
                                            {contest.status.toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[var(--text-secondary)]">
                                            {contest.problems}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[var(--text-secondary)]">
                                            {contest.participants}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button size="sm" variant="ghost">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setDeleteModal({
                                                        isOpen: true,
                                                        type: "contest",
                                                        id: contest.id,
                                                    })
                                                }
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <Modal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal(null)}
                    title={`Delete ${deleteModal.type === "problem" ? "Problem" : "Contest"}`}
                    footer={
                        <>
                            <Button variant="outline" onClick={() => setDeleteModal(null)}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={handleDelete}>
                                Delete
                            </Button>
                        </>
                    }
                >
                    <p className="text-[var(--text-primary)]">
                        Are you sure you want to delete this {deleteModal.type}? This action cannot
                        be undone.
                    </p>
                </Modal>
            )}
        </div>
    );
}
