import React from "react";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Clock, Users, Trophy, Calendar, ArrowLeft } from "lucide-react";
import { mockContests, mockProblems, type Contest } from "../../data/mockData";

interface ContestDetailProps {
    contestId: string;
    onNavigate: (page: string, id?: string) => void;
}

export function ContestDetail({ contestId, onNavigate }: ContestDetailProps) {
    const contest = mockContests.find((c) => c.id === contestId);

    if (!contest) {
        return <div>Contest not found</div>;
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getDuration = () => {
        const diff = contest.endTime.getTime() - contest.startTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        return `${hours} hours`;
    };

    const getContestStatusBadge = (status: Contest["status"]) => {
        const variants = {
            upcoming: "info" as const,
            ongoing: "success" as const,
            finished: "default" as const,
        };

        return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
    };

    const totalScore = contest.problems.reduce((sum, p) => sum + p.score, 0);

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
                    Back to Home
                </Button>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-[var(--text-primary)]">{contest.name}</h1>
                            {getContestStatusBadge(contest.status)}
                        </div>
                        <p className="text-[var(--text-secondary)]">{contest.description}</p>
                    </div>
                    {contest.status === "ongoing" ? (
                        <Button size="lg">
                            <Trophy className="w-4 h-4 mr-2" />
                            Continue Contest
                        </Button>
                    ) : contest.status === "upcoming" ? (
                        <Button size="lg">
                            <Trophy className="w-4 h-4 mr-2" />
                            Register
                        </Button>
                    ) : (
                        <Button size="lg" variant="secondary">
                            View Results
                        </Button>
                    )}
                </div>
            </div>

            {/* Contest Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[var(--text-tertiary)] text-sm">Start Time</p>
                                <p className="text-[var(--text-primary)]">
                                    {formatDate(contest.startTime)}
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-[var(--text-tertiary)] text-sm">Duration</p>
                                <p className="text-[var(--text-primary)]">{getDuration()}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-[var(--text-tertiary)] text-sm">Participants</p>
                                <p className="text-[var(--text-primary)]">{contest.participants}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-[var(--text-tertiary)] text-sm">Total Score</p>
                                <p className="text-[var(--text-primary)]">{totalScore}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Problems List */}
            <Card>
                <CardHeader>
                    <h3 className="text-[var(--text-primary)]">Contest Problems</h3>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border-color)]">
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    #
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Problem
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Score
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Solved
                                </th>
                                <th className="px-6 py-3 text-right text-xs text-[var(--text-tertiary)] uppercase">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {contest.problems.map((contestProblem, index) => {
                                const problem = mockProblems.find(
                                    (p) => p.id === contestProblem.problemId
                                );
                                if (!problem) return null;

                                return (
                                    <tr
                                        key={problem.id}
                                        className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-[var(--text-primary)]">
                                                {String.fromCharCode(65 + index)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-[var(--text-primary)]">
                                                    {problem.title}
                                                </div>
                                                <div className="text-sm text-[var(--text-tertiary)] mt-0.5">
                                                    Time: {problem.timeLimit}ms | Memory:{" "}
                                                    {problem.memoryLimit}MB
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[var(--text-primary)]">
                                                {contestProblem.score}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[var(--text-secondary)]">-</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    onNavigate("problem-detail", problem.id)
                                                }
                                            >
                                                Solve
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Leaderboard Preview */}
            {contest.status !== "upcoming" && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="text-[var(--text-primary)]">Leaderboard</h3>
                            <Button variant="ghost" size="sm">
                                View Full Leaderboard
                            </Button>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--border-color)]">
                                    <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                        Rank
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                        Participant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                        Score
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                        Time
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { rank: 1, name: "Alice Johnson", score: 750, time: "1:23:45" },
                                    { rank: 2, name: "Bob Smith", score: 650, time: "1:45:20" },
                                    { rank: 3, name: "Charlie Brown", score: 600, time: "1:52:10" },
                                ].map((entry) => (
                                    <tr
                                        key={entry.rank}
                                        className="border-b border-[var(--border-color)]"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-[var(--text-primary)]">
                                                #{entry.rank}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[var(--text-primary)]">
                                                {entry.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[var(--text-primary)]">
                                                {entry.score}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[var(--text-secondary)]">
                                                {entry.time}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
