import api from "./api";

export interface UserStats {
    totalSubmissions: number;
    acceptedCount: number;
    acceptanceRate: number;
    solvedProblems: number;
    contestsJoined: number;
}

export interface SystemStats {
    totalUsers: number;
    activeUsers: number;
    totalProblems: number;
    publicProblems: number;
    totalSubmissions: number;
    pendingSubmissions: number;
    totalContests: number;
    activeContests: number;
}

export interface InstructorStats {
    totalProblems: number;
    totalContests: number;
    totalParticipants: number;
    avgAcceptanceRate: number;
}

export interface SubmissionDayCount {
    date: string;
    count: number;
}

export interface VerdictCount {
    verdict: string;
    count: number;
}

export const statsService = {
    async getMyStats(): Promise<UserStats> {
        const response = await api.get("/stats/me");
        return response.data.result;
    },

    async getUserStats(userId: string): Promise<UserStats> {
        const response = await api.get(`/stats/users/${userId}`);
        return response.data.result;
    },

    async getSystemStats(): Promise<SystemStats> {
        const response = await api.get("/admin/stats");
        return response.data.result;
    },

    async getInstructorStats(): Promise<InstructorStats> {
        const response = await api.get("/stats/instructor");
        return response.data.result;
    },

    async getWeeklySubmissions(): Promise<SubmissionDayCount[]> {
        const response = await api.get("/admin/stats/submissions-weekly");
        return response.data.result;
    },

    async getVerdictDistribution(): Promise<VerdictCount[]> {
        const response = await api.get("/admin/stats/verdict-distribution");
        return response.data.result;
    },
};
