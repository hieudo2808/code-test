import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { DifficultyBadge } from "~/components/ui/badge";
import { Loader2 } from "lucide-react";
import { problemService, type ProblemListItem } from "~/services/problemService";

export function ProblemListPage() {
    const navigate = useNavigate();
    const [problems, setProblems] = useState<ProblemListItem[]>([]);
    const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const res = await problemService.getProblems();
                setProblems(res.content || []);
            } catch (error) {
                console.error("Error fetching problems:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const filteredProblems = problems.filter((problem) => {
        if (difficultyFilter === "all") return true;
        return problem.difficulty === difficultyFilter.toUpperCase();
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-(--text-primary) mb-1">Problems</h1>
                    <p className="text-(--text-secondary)">
                        Practice problems to sharpen your programming skills.
                    </p>
                </div>
                <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="px-3 py-2 text-sm bg-(--bg-app) border border-(--border-color) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-red-500 font-medium cursor-pointer w-fit"
                >
                    <option value="all">All Difficulties</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                </select>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-(--border-color) bg-(--bg-tertiary)">
                                <th className="px-4 py-3 text-left text-xs text-(--text-secondary) uppercase font-semibold tracking-wider">
                                    Title
                                </th>
                                <th className="px-4 py-3 text-left text-xs text-(--text-secondary) uppercase font-semibold tracking-wider">
                                    Difficulty
                                </th>
                                <th className="px-4 py-3 text-left text-xs text-(--text-secondary) uppercase font-semibold tracking-wider">
                                    Max Score
                                </th>
                                <th className="px-4 py-3 text-right text-xs text-(--text-secondary) uppercase font-semibold tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProblems.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-8 text-center text-(--text-secondary)"
                                    >
                                        No problems found.
                                    </td>
                                </tr>
                            ) : (
                                filteredProblems.map((problem) => (
                                    <tr
                                        key={problem.problemId}
                                        className="border-b border-(--border-color) hover:bg-(--bg-tertiary) cursor-pointer transition-colors group"
                                        onClick={() => navigate(`/problems/${problem.slug}`)}
                                    >
                                        <td className="px-4 py-3">
                                            <span className="text-(--text-primary) font-medium group-hover:text-red-500 transition-colors">
                                                {problem.title}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <DifficultyBadge
                                                difficulty={
                                                    problem.difficulty as "EASY" | "MEDIUM" | "HARD"
                                                }
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-(--text-secondary) font-medium">
                                                {problem.maxScore}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button size="sm" variant="primary">
                                                Solve
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
