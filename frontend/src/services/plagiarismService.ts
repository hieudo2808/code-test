import api from "./api";

export interface PlagiarismResult {
    checkId: string;
    problemId: string;
    problemTitle: string;
    submission1Id: string;
    submission2Id: string;
    user1Id: string;
    user1Name: string;
    user2Id: string;
    user2Name: string;
    similarity: number;
    checkedAt: string;
}

export const plagiarismService = {
    async triggerCheck(contestId: string): Promise<void> {
        await api.post(`/contests/${contestId}/plagiarism-check`);
    },

    async getResults(contestId: string): Promise<PlagiarismResult[]> {
        const response = await api.get(`/contests/${contestId}/plagiarism`);
        return response.data.result;
    },

    async getResultsByProblem(contestId: string, problemId: string): Promise<PlagiarismResult[]> {
        const response = await api.get(`/contests/${contestId}/plagiarism/problem/${problemId}`);
        return response.data.result;
    },
};
