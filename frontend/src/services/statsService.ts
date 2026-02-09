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
};
