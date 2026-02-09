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

export const LANGUAGE_OPTIONS = [
    { id: 54, name: "C++ (GCC 9.2)" },
    { id: 62, name: "Java (OpenJDK 13)" },
    { id: 71, name: "Python (3.8)" },
    { id: 63, name: "JavaScript (Node.js 12)" },
    { id: 50, name: "C (GCC 9.2)" },
] as const;
