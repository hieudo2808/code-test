import api from "./api";

export interface Contest {
    contestId: string;
    contestName: string;
    state: "UPCOMING" | "RUNNING" | "FROZEN" | "FINISHED";
    contestType: "PRACTICE" | "CONTEST";
    startTime: string;
    endTime: string;
    freezeTime?: string;
    isPublic: boolean;
    allowLateJoin: boolean;
    isJoined: boolean;
    problemCount: number;
    participantCount: number;
}

export interface ContestProblem {
    problemId: string;
    title: string;
    slug: string;
    difficulty?: string;
    maxScore?: number;
    maxSubmissions: number | null;
    submissionCount: number;
}

export interface CreateContestRequest {
    contestName: string;
    startTime: string;
    endTime: string;
    isPublic?: boolean;
}

export interface UpdateContestRequest {
    contestName?: string;
    startTime?: string;
    endTime?: string;
    isPublic?: boolean;
}

export interface AddContestProblemRequest {
    problemId: string;
    maxScore?: number;
    maxSubmissions?: number;
}

export const contestService = {
    async getContests(page = 0, size = 20) {
        const response = await api.get(`/contests?page=${page}&size=${size}`);
        return response.data.result;
    },

    async getMyContests(page = 0, size = 50) {
        const response = await api.get(`/contests/my?page=${page}&size=${size}`);
        return response.data.result;
    },

    async getContest(id: string): Promise<Contest> {
        const response = await api.get(`/contests/${id}`);
        return response.data.result;
    },

    async createContest(request: CreateContestRequest): Promise<Contest> {
        const response = await api.post("/contests", request);
        return response.data.result;
    },

    async updateContest(id: string, request: UpdateContestRequest): Promise<Contest> {
        const response = await api.put(`/contests/${id}`, request);
        return response.data.result;
    },

    async addProblemToContest(contestId: string, request: AddContestProblemRequest): Promise<void> {
        await api.post(`/contests/${contestId}/problems`, request);
    },

    async joinContest(id: string): Promise<void> {
        await api.post(`/contests/${id}/join`);
    },

    async getContestProblems(contestId: string): Promise<ContestProblem[]> {
        const response = await api.get(`/contests/${contestId}/problems`);
        return response.data.result;
    },

    async deleteContest(contestId: string): Promise<void> {
        await api.delete(`/contests/${contestId}`);
    },

    async getParticipants(contestId: string) {
        const response = await api.get(`/contests/${contestId}/participants`);
        return response.data.result;
    },

    async addParticipant(contestId: string, email: string) {
        const response = await api.post(`/contests/${contestId}/participants`, { email });
        return response.data.result;
    },

    async addParticipants(contestId: string, emails: string[]) {
        const response = await api.post(`/contests/${contestId}/participants/bulk`, { emails });
        return response.data;
    },

    async removeParticipant(contestId: string, userId: string): Promise<void> {
        await api.delete(`/contests/${contestId}/participants/${userId}`);
    },
};
