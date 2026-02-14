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
    contestId?: string;
    status: "PENDING" | "JUDGING" | "DONE" | "ERROR";
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

    async getMySubmissionsByProblem(problemId: string, page = 0, size = 5) {
        const response = await api.get(
            `/submissions/me/problem/${problemId}?page=${page}&size=${size}`
        );
        return response.data.result;
    },

    async pollSubmission(id: string, maxAttempts = 240, interval = 500): Promise<Submission> {
        for (let i = 0; i < maxAttempts; i++) {
            const submission = await this.getSubmission(id);
            if (submission.status === "DONE" || submission.status === "ERROR") {
                return submission;
            }
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
        throw new Error("Submission timeout");
    },

    async getTestcaseDetail(submissionId: string, testcaseId: string): Promise<TestcaseDetail> {
        const response = await api.get(
            `/submissions/${submissionId}/results/${testcaseId}/detail`
        );
        return response.data.result;
    },
};
