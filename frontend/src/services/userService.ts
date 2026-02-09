import api from "./api";

export interface UserResponse {
    userId: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    bio?: string;
    roleName: string;
    isActive: boolean;
    createdAt: string;
}

export const userService = {
    async getUsers(): Promise<UserResponse[]> {
        const response = await api.get("/users");
        return response.data.result;
    },

    async getUser(id: string): Promise<UserResponse> {
        const response = await api.get(`/users/${id}`);
        return response.data.result;
    },

    async getMyProfile(): Promise<UserResponse> {
        const response = await api.get("/users/me");
        return response.data.result;
    },

    async createUser(request: CreateUserRequest): Promise<UserResponse> {
        const response = await api.post("/users", request);
        return response.data.result;
    },

    async updateUser(id: string, data: Partial<UserResponse>): Promise<UserResponse> {
        const response = await api.put(`/users/${id}`, data);
        return response.data.result;
    },

    async deleteUser(id: string): Promise<void> {
        await api.delete(`/users/${id}`);
    },
};

export interface CreateUserRequest {
    fullName: string;
    email: string;
    roleName: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}
