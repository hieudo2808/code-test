import React, { useState } from "react";
import { Card, CardHeader, CardBody } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge, DifficultyBadge } from "~/components/ui/Badge";
import { Trophy, Clock, Users, ChevronRight, Filter } from "lucide-react";
import { mockProblems, mockContests, type Contest, type Problem } from "~/lib/mock-data";

interface HomePageProps {
    onNavigate: (page: string, id?: string) => void;
}

// Helper function to format date
const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

// Helper function to get status badge
const getContestStatusBadge = (status: string) => {
    if (status === "upcoming") {
        return <Badge variant="info">UPCOMING</Badge>;
    } else if (status === "ongoing") {
        return <Badge variant="success">ONGOING</Badge>;
    } else {
        return <Badge variant="default">FINISHED</Badge>;
    }
};

export function HomePage({ onNavigate }: HomePageProps) {
    const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const filteredContests = mockContests.filter((contest) => {
        if (statusFilter === "all") return true;
        return contest.status === statusFilter;
    });

    const filteredProblems = mockProblems.filter((problem) => {
        if (difficultyFilter === "all") return true;
        return problem.difficulty === difficultyFilter;
    });

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getContestStatusBadge = (status: Contest["status"]) => {
        const variants = {
            upcoming: "info" as const,
            ongoing: "success" as const,
            finished: "default" as const,
        };

        return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="animate-fade-in">
                <h1 className="text-gray-900 mb-2">Welcome Back!</h1>
                <p className="text-gray-600">
                    Practice problems and join contests to improve your skills.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card hover={true}>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">
                                    Problems Solved
                                </p>
                                <h2 className="text-gray-900 mt-2 text-3xl font-bold">45</h2>
                            </div>
                            <div className="w-14 h-14 bg-linear-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ">
                                <Trophy className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card hover={true}>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">
                                    Total Submissions
                                </p>
                                <h2 className="text-gray-900 mt-2 text-3xl font-bold">123</h2>
                            </div>
                            <div className="w-14 h-14 bg-linear-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card hover={true}>
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">
                                    Contests Joined
                                </p>
                                <h2 className="text-gray-900 mt-2 text-3xl font-bold">8</h2>
                            </div>
                            <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Active Contests */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-gray-900">Active Contests</h2>
                    <div className="flex items-center gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-1.5 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium shadow-sm hover:border-gray-400 transition-all cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="finished">Finished</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredContests.map((contest) => (
                        <Card key={contest.id} hover={true}>
                            <CardBody>
                                <div
                                    className="flex items-start justify-between gap-6"
                                    onClick={() => onNavigate("contest-detail", contest.id)}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-gray-900">{contest.name}</h3>
                                            {getContestStatusBadge(contest.status)}
                                        </div>
                                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                                            {contest.description}
                                        </p>
                                        <div className="flex items-center gap-8  text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                <span>{formatDate(contest.startTime)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                <span>{contest.participants} participants</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Trophy className="w-4 h-4" />
                                                <span>{contest.problems.length} problems</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-gray-500 shrink-0 transition-transform group-hover:translate-x-1" />
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Practice Problems */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-gray-900">Practice Problems</h2>
                    <div className="flex items-center gap-2">
                        <select
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            className="px-3 py-1.5 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium shadow-sm hover:border-gray-400 transition-all cursor-pointer"
                        >
                            <option value="all">All Difficulty</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                </div>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200 bg-gray-50">
                                    <th className="px-4 py-2 text-left text-xs text-gray-600 uppercase font-semibold tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs text-gray-600 uppercase font-semibold tracking-wider">
                                        Difficulty
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs text-gray-600 uppercase font-semibold tracking-wider">
                                        Acceptance
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs text-gray-600 uppercase font-semibold tracking-wider">
                                        Submissions
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs text-gray-600 uppercase font-semibold tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProblems.map((problem) => (
                                    <tr
                                        key={problem.id}
                                        className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors group"
                                        onClick={() => onNavigate("problem-detail", problem.id)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900 font-medium group-hover:text-red-600 transition-colors">
                                                {problem.title}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <DifficultyBadge difficulty={problem.difficulty} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-gray-600 font-medium">
                                                {problem.acceptanceRate}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-gray-600 font-medium">
                                                {problem.totalSubmissions}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button size="sm" variant="primary">
                                                Solve
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
