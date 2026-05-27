import api from "./api";

export interface SubmitRequest {
    problemId: string;
    contestId?: string;
    languageId: number;
    sourceCode: string;
}

export interface SubmissionResult {
    testcaseId: string;
    verdict: string | null;
    timeMs: number | null;
    memoryKb: number | null;
    score: number;
    maxScore: number;
    isHidden: boolean;
}

export interface TestcaseDetail {
    input: string;
    expectedOutput: string;
    actualOutput: string;
}

export interface Submission {
    submissionId: string;
    problemId: string;
    problemTitle: string;
    problemSlug: string;
    problemEvaluationType?: string;
    contestId?: string;
    status: "PENDING" | "JUDGING" | "DONE" | "ERROR" | "NEED_REVIEW";
    verdict?: string;
    message?: string;
    score?: number;
    maxScore?: number;
    submittedAt: string;
    finishedAt?: string;
    submitterId: string;
    submitterName: string;
    languageId: number;
    sourceCode?: string;
    totalTimeMs?: number;
    results?: SubmissionResult[];
}

export const submissionService = {
    async submit(request: SubmitRequest): Promise<Submission> {
        const response = await api.post("/submissions", request);
        return response.data.result;
    },

    async getSubmission(id: string): Promise<Submission> {
        const response = await api.get(`/submissions/${id}`);
        return response.data.result;
    },

    async getMySubmissions(page = 0, size = 20) {
        const response = await api.get(`/submissions/me?page=${page}&size=${size}`);
        return response.data.result;
    },

    async getMySubmissionsByProblem(
        problemId: string,
        page = 0,
        size = 5,
        contestId?: string | null
    ) {
        const params = new URLSearchParams({ page: String(page), size: String(size) });
        if (contestId) params.append("contestId", contestId);
        const response = await api.get(`/submissions/me/problem/${problemId}?${params.toString()}`);
        return response.data.result;
    },

    async pollSubmission(id: string, maxAttempts = 240, interval = 500): Promise<Submission> {
        for (let i = 0; i < maxAttempts; i++) {
            const submission = await this.getSubmission(id);
            if (
                submission.status === "DONE" ||
                submission.status === "ERROR" ||
                submission.status === "NEED_REVIEW"
            ) {
                return submission;
            }
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
        throw new Error("Submission timeout");
    },

    async getTestcaseDetail(submissionId: string, testcaseId: string): Promise<TestcaseDetail> {
        const response = await api.get(`/submissions/${submissionId}/results/${testcaseId}/detail`);
        return response.data.result;
    },

    async searchContestSubmissions(
        contestId: string,
        filters: { problemId?: string; submitterId?: string; verdict?: string },
        page = 0,
        size = 20
    ) {
        const params = new URLSearchParams({ page: String(page), size: String(size) });
        if (filters.problemId) params.append("problemId", filters.problemId);
        if (filters.submitterId) params.append("submitterId", filters.submitterId);
        if (filters.verdict) params.append("verdict", filters.verdict);
        const response = await api.get(`/submissions/contest/${contestId}?${params.toString()}`);
        return response.data.result;
    },

    async searchProblemSubmissions(
        problemId: string,
        filters: { submitterId?: string; verdict?: string },
        page = 0,
        size = 20
    ) {
        const params = new URLSearchParams({ page: String(page), size: String(size) });
        if (filters.submitterId) params.append("submitterId", filters.submitterId);
        if (filters.verdict) params.append("verdict", filters.verdict);
        const response = await api.get(
            `/submissions/problem/${problemId}/search?${params.toString()}`
        );
        return response.data.result;
    },

    async gradeSubmission(
        submissionId: string,
        data: { score: number; verdict: string }
    ): Promise<Submission> {
        const response = await api.put(`/submissions/${submissionId}/grade`, data);
        return response.data.result;
    },

    async deleteSubmission(submissionId: string): Promise<void> {
        await api.delete(`/submissions/${submissionId}`);
    },

    async rejudge(submissionId: string): Promise<Submission> {
        const response = await api.post(`/submissions/${submissionId}/rejudge`);
        return response.data.result;
    },
};
