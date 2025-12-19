export type UserRole = "student" | "instructor" | "admin";

export type ProblemDifficulty = "Easy" | "Medium" | "Hard";

export type SubmissionStatus =
    | "Accepted"
    | "Wrong Answer"
    | "Time Limit Exceeded"
    | "Memory Limit Exceeded"
    | "Runtime Error"
    | "Pending";

export interface Problem {
    id: string;
    title: string;
    difficulty: ProblemDifficulty;
    description: string;
    inputDescription: string;
    outputDescription: string;
    constraints: string[];
    sampleTestcases: {
        input: string;
        output: string;
        explanation?: string;
    }[];
    timeLimit: number; // ms
    memoryLimit: number; // MB
    acceptanceRate?: number;
    totalSubmissions?: number;
}

export interface Contest {
    id: string;
    name: string;
    description: string;
    startTime: Date;
    endTime: Date;
    status: "upcoming" | "ongoing" | "finished";
    problems: {
        problemId: string;
        score: number;
    }[];
    participants?: number;
}

export interface Submission {
    id: string;
    problemId: string;
    userId: string;
    code: string;
    language: string;
    status: SubmissionStatus;
    score?: number;
    submittedAt: Date;
    executionTime?: number;
    memoryUsed?: number;
    testcaseResults?: {
        testcaseId: number;
        status: SubmissionStatus;
        executionTime: number;
        memoryUsed: number;
        score: number;
    }[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    enabled: boolean;
    solvedProblems?: number;
    totalSubmissions?: number;
}

export const mockProblems: Problem[] = [
    {
        id: "p1",
        title: "Two Sum",
        difficulty: "Easy",
        description:
            "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.",
        inputDescription:
            "The first line contains an integer `n`, the length of the array.\nThe second line contains `n` space-separated integers.\nThe third line contains the target integer.",
        outputDescription:
            "Output two space-separated integers representing the indices of the two numbers.",
        constraints: [
            "2 ≤ n ≤ 10^4",
            "-10^9 ≤ nums[i] ≤ 10^9",
            "-10^9 ≤ target ≤ 10^9",
            "Only one valid answer exists",
        ],
        sampleTestcases: [
            {
                input: "4\n2 7 11 15\n9",
                output: "0 1",
                explanation: "nums[0] + nums[1] = 2 + 7 = 9",
            },
            {
                input: "3\n3 2 4\n6",
                output: "1 2",
            },
        ],
        timeLimit: 1000,
        memoryLimit: 256,
        acceptanceRate: 48.5,
        totalSubmissions: 12453,
    },
    {
        id: "p2",
        title: "Binary Search",
        difficulty: "Easy",
        description:
            "Given a sorted array of integers and a target value, return the index of the target if it exists, otherwise return `-1`.\n\nYou must write an algorithm with **O(log n)** runtime complexity.",
        inputDescription:
            "The first line contains two integers `n` and `target`.\nThe second line contains `n` space-separated integers in sorted order.",
        outputDescription:
            "Output a single integer representing the index of the target, or -1 if not found.",
        constraints: [
            "1 ≤ n ≤ 10^4",
            "-10^4 ≤ nums[i], target ≤ 10^4",
            "All integers in nums are unique",
            "nums is sorted in ascending order",
        ],
        sampleTestcases: [
            {
                input: "5 7\n1 3 5 7 9",
                output: "3",
            },
            {
                input: "5 6\n1 3 5 7 9",
                output: "-1",
            },
        ],
        timeLimit: 1000,
        memoryLimit: 256,
        acceptanceRate: 65.2,
        totalSubmissions: 8921,
    },
    {
        id: "p3",
        title: "Longest Increasing Subsequence",
        difficulty: "Medium",
        description:
            "Given an integer array `nums`, return the length of the longest **strictly increasing subsequence**.\n\nA subsequence is a sequence that can be derived from an array by deleting some or no elements without changing the order of the remaining elements.",
        inputDescription:
            "The first line contains an integer `n`.\nThe second line contains `n` space-separated integers.",
        outputDescription:
            "Output a single integer representing the length of the longest increasing subsequence.",
        constraints: ["1 ≤ n ≤ 2500", "-10^4 ≤ nums[i] ≤ 10^4"],
        sampleTestcases: [
            {
                input: "8\n10 9 2 5 3 7 101 18",
                output: "4",
                explanation: "The longest increasing subsequence is [2,3,7,101]",
            },
            {
                input: "7\n0 1 0 3 2 3 7",
                output: "4",
            },
        ],
        timeLimit: 2000,
        memoryLimit: 256,
        acceptanceRate: 42.8,
        totalSubmissions: 5632,
    },
    {
        id: "p4",
        title: "Merge K Sorted Lists",
        difficulty: "Hard",
        description:
            "You are given an array of `k` linked-lists, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.",
        inputDescription:
            "The first line contains an integer `k`.\nThe next `k` lines each contain a sorted list of integers.",
        outputDescription: "Output a single line containing the merged sorted list.",
        constraints: [
            "k = lists.length",
            "0 ≤ k ≤ 10^4",
            "0 ≤ lists[i].length ≤ 500",
            "-10^4 ≤ lists[i][j] ≤ 10^4",
        ],
        sampleTestcases: [
            {
                input: "3\n1 4 5\n1 3 4\n2 6",
                output: "1 1 2 3 4 4 5 6",
            },
        ],
        timeLimit: 3000,
        memoryLimit: 512,
        acceptanceRate: 38.2,
        totalSubmissions: 3421,
    },
    {
        id: "p5",
        title: "Valid Parentheses",
        difficulty: "Easy",
        description:
            "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.",
        inputDescription: "A single line containing the string `s`.",
        outputDescription: 'Output "true" if the string is valid, "false" otherwise.',
        constraints: ["1 ≤ s.length ≤ 10^4", "s consists of parentheses only: ()[]{}"],
        sampleTestcases: [
            {
                input: "()",
                output: "true",
            },
            {
                input: "()[]{}",
                output: "true",
            },
            {
                input: "(]",
                output: "false",
            },
        ],
        timeLimit: 1000,
        memoryLimit: 256,
        acceptanceRate: 52.3,
        totalSubmissions: 9834,
    },
    {
        id: "p6",
        title: "Maximum Subarray",
        difficulty: "Medium",
        description:
            "Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
        inputDescription:
            "The first line contains an integer `n`.\nThe second line contains `n` space-separated integers.",
        outputDescription: "Output a single integer representing the maximum subarray sum.",
        constraints: ["1 ≤ n ≤ 10^5", "-10^4 ≤ nums[i] ≤ 10^4"],
        sampleTestcases: [
            {
                input: "9\n-2 1 -3 4 -1 2 1 -5 4",
                output: "6",
                explanation: "[4,-1,2,1] has the largest sum = 6",
            },
        ],
        timeLimit: 1500,
        memoryLimit: 256,
        acceptanceRate: 46.7,
        totalSubmissions: 7234,
    },
];

export const mockContests: Contest[] = [
    {
        id: "c1",
        name: "Weekly Contest 120",
        description:
            "A weekly contest featuring 4 problems of varying difficulty. Test your algorithmic skills and compete with others!",
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        status: "upcoming",
        problems: [
            { problemId: "p1", score: 100 },
            { problemId: "p2", score: 150 },
            { problemId: "p3", score: 200 },
            { problemId: "p4", score: 300 },
        ],
        participants: 0,
    },
    {
        id: "c2",
        name: "Educational Round 15",
        description:
            "An educational round designed for learning. Detailed editorials will be published after the contest.",
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        endTime: new Date(Date.now() + 90 * 60 * 1000),
        status: "ongoing",
        problems: [
            { problemId: "p5", score: 100 },
            { problemId: "p6", score: 150 },
            { problemId: "p3", score: 200 },
        ],
        participants: 342,
    },
    {
        id: "c3",
        name: "Beginner Practice Contest",
        description:
            "Perfect for beginners! This contest features easy problems to help you get started.",
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        status: "finished",
        problems: [
            { problemId: "p1", score: 100 },
            { problemId: "p5", score: 100 },
            { problemId: "p2", score: 150 },
        ],
        participants: 521,
    },
    {
        id: "c4",
        name: "Advanced Algorithms Championship",
        description:
            "A challenging contest for experienced programmers. Features complex problems requiring deep algorithmic knowledge.",
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        status: "upcoming",
        problems: [
            { problemId: "p3", score: 200 },
            { problemId: "p4", score: 300 },
        ],
        participants: 0,
    },
];

export const mockUsers: User[] = [
    {
        id: "u1",
        name: "John Doe",
        email: "john.doe@example.com",
        role: "student",
        enabled: true,
        solvedProblems: 45,
        totalSubmissions: 123,
    },
    {
        id: "u2",
        name: "Jane Smith",
        email: "jane.smith@example.com",
        role: "instructor",
        enabled: true,
    },
    {
        id: "u3",
        name: "Alice Johnson",
        email: "alice.j@example.com",
        role: "student",
        enabled: true,
        solvedProblems: 67,
        totalSubmissions: 201,
    },
    {
        id: "u4",
        name: "Bob Williams",
        email: "bob.w@example.com",
        role: "student",
        enabled: false,
        solvedProblems: 12,
        totalSubmissions: 34,
    },
    {
        id: "u5",
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        enabled: true,
    },
];
