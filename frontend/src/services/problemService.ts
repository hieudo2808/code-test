import api from "./api";

export interface Problem {
    problemId: string;
    title: string;
    slug: string;
    description: string;
    inputDescription: string;
    outputDescription: string;
    constraints: string;
    sampleInput: string;
    sampleOutput: string;
    difficulty: string;
    timeLimit: number;
    memoryLimit: number;
    maxScore: number;
    isPublic: boolean;
    problemDescription?: string; // It was 'description' in interface but 'problemDescription' in request/response? Backend 'ProblemResponse' has 'problemDescription'.
    // Let's check 'description' vs 'problemDescription'.
    // Backend 'ProblemResponse' usually has 'problemDescription'.
    // Step 1113 UpdateProblemRequest has 'problemDescription'.
    // Step 1174 Problem interface has 'description'.
    // I should check what API returns.
    // Assuming backend returns what matches DTO.
    // I'll add both or optional.
    evaluationType?: string;
    solutionCode?: string;
    solutionLanguageId?: number;
    scorerCode?: string;
    scorerLanguageId?: number;
}

export interface ProblemListItem {
    problemId: string;
    title: string;
    slug: string;
    difficulty: string;
    maxScore: number;
    acceptanceRate?: number;
}

export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export const problemService = {
    async getProblems(page = 0, size = 20): Promise<PaginatedResponse<ProblemListItem>> {
        const response = await api.get(`/problems?page=${page}&size=${size}`);
        return response.data.result;
    },

    async getProblem(id: string): Promise<Problem> {
        const response = await api.get(`/problems/${id}`);
        return response.data.result;
    },

    async getProblemBySlug(slug: string): Promise<Problem> {
        const response = await api.get(`/problems/slug/${slug}`);
        return response.data.result;
    },

    async createProblem(request: CreateProblemRequest): Promise<Problem> {
        const response = await api.post("/problems", request);
        return response.data.result;
    },

    async createTestcase(problemId: string, formData: FormData): Promise<any> {
        const response = await api.post(`/problems/${problemId}/testcases`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data.result;
    },

    async generateOutputs(problemId: string): Promise<number> {
        const response = await api.post(`/problems/${problemId}/generate-outputs`);
        return response.data.result;
    },
    async updateProblem(id: string, request: UpdateProblemRequest): Promise<Problem> {
        const response = await api.put(`/problems/${id}`, request);
        return response.data.result;
    },

    async getTestcases(problemId: string): Promise<TestcaseResponse[]> {
        const response = await api.get(`/problems/${problemId}/testcases`);
        return response.data.result;
    },

    async updateTestcase(testcaseId: string, formData: FormData): Promise<TestcaseResponse> {
        const response = await api.put(`/testcases/${testcaseId}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data.result;
    },

    async deleteTestcase(testcaseId: string): Promise<void> {
        await api.delete(`/testcases/${testcaseId}`);
    },

    async deleteProblem(problemId: string): Promise<void> {
        await api.delete(`/problems/${problemId}`);
    },
};

export interface CreateProblemRequest {
    title: string;
    slug: string;
    problemDescription?: string;
    evaluationType: "EXACT" | "HEURISTIC" | "MANUAL";
    timeLimit?: number;
    memoryLimit?: number;
    difficulty?: "EASY" | "MEDIUM" | "HARD";
    sampleInput?: string;
    sampleOutput?: string;
    isPublic?: boolean;
    maxScore?: number;
    // For auto-generate output
    solutionCode?: string;
    solutionLanguageId?: number;
    // For heuristic judging
    scorerCode?: string;
    scorerLanguageId?: number;
}

export interface UpdateProblemRequest {
    title?: string;
    problemDescription?: string;
    evaluationType?: "EXACT" | "HEURISTIC" | "MANUAL";
    timeLimit?: number;
    memoryLimit?: number;
    difficulty?: "EASY" | "MEDIUM" | "HARD";
    sampleInput?: string;
    sampleOutput?: string;
    isPublic?: boolean;
    maxScore?: number;
    solutionCode?: string;
    solutionLanguageId?: number;
    scorerCode?: string;
    scorerLanguageId?: number;
}

export interface TestcaseResponse {
    testcaseId: string;
    inputPath: string;
    outputPath: string;
    inputSizeKb: number;
    outputSizeKb: number;
    testcasePoint: number;
    isHidden: boolean;
    // We might need raw input/output for editing, but backend only returns paths?
    // Wait, backend returns TestcaseResponse which has paths.
    // Does it return CONTENT? checking TestcaseResponse backend DTO...
}

export const LANGUAGE_OPTIONS = [
    { id: 54, name: "C++ (GCC 9.2)" },
    { id: 62, name: "Java (OpenJDK 13)" },
    { id: 71, name: "Python (3.8)" },
    { id: 63, name: "JavaScript (Node.js 12)" },
    { id: 50, name: "C (GCC 9.2)" },
] as const;
