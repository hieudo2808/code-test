import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Trophy, Clock, Users, ChevronRight, Loader2 } from "lucide-react";
import { contestService, type Contest } from "~/services/contestService";

export function ContestListPage() {
    const navigate = useNavigate();
    const [contests, setContests] = useState<Contest[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const res = await contestService.getContests();
                setContests(res.content || []);
            } catch (error) {
                console.error("Error fetching contests:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const filteredContests = contests.filter((contest) => {
        if (statusFilter === "all") return true;
        return contest.state === statusFilter.toUpperCase();
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getContestStatusBadge = (state: Contest["state"]) => {
        const variants: Record<string, "info" | "success" | "default" | "warning"> = {
            UPCOMING: "info",
            RUNNING: "success",
            FROZEN: "warning",
            FINISHED: "default",
        };
        return <Badge variant={variants[state] || "default"}>{state}</Badge>;
    };

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
                    <h1 className="text-(--text-primary) mb-1">Contests</h1>
                    <p className="text-(--text-secondary)">
                        Browse and join programming contests.
                    </p>
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-sm bg-(--bg-app) border border-(--border-color) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-red-500 font-medium cursor-pointer w-fit"
                >
                    <option value="all">All Statuses</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="RUNNING">Running</option>
                    <option value="FINISHED">Finished</option>
                </select>
            </div>

            <div className="space-y-3">
                {filteredContests.length === 0 ? (
                    <Card>
                        <CardBody>
                            <p className="text-(--text-secondary) text-center py-8">
                                No contests found.
                            </p>
                        </CardBody>
                    </Card>
                ) : (
                    filteredContests.map((contest) => (
                        <Card key={contest.contestId}>
                            <CardBody>
                                <div
                                    className="flex items-start justify-between gap-4 cursor-pointer group"
                                    onClick={() => navigate(`/contests/${contest.contestId}`)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-(--text-primary) font-semibold group-hover:text-red-500 transition-colors truncate">
                                                {contest.contestName}
                                            </h3>
                                            {getContestStatusBadge(contest.state)}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-(--text-secondary)">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                <span>{formatDate(contest.startTime)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-4 h-4" />
                                                <span>{contest.participantCount} participants</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Trophy className="w-4 h-4" />
                                                <span>{contest.problemCount} problems</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-(--text-secondary) group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1" />
                                </div>
                            </CardBody>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
