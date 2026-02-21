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

    async updateUser(id: string, data: AdminUpdateUserRequest): Promise<UserResponse> {
        const response = await api.put(`/users/${id}`, data);
        return response.data.result;
    },

    async deleteUser(id: string): Promise<void> {
        await api.delete(`/users/${id}`);
    },

    async updateMyProfile(data: UpdateProfileRequest): Promise<UserResponse> {
        const response = await api.put("/users/me", data);
        return response.data.result;
    },

    async changePassword(data: ChangePasswordRequest): Promise<void> {
        await api.put("/users/me/password", data);
    },

    async updateMyAvatar(file: File): Promise<string> {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.put("/users/me/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data.result;
    },
};

export interface AdminUpdateUserRequest {
    roleName: "STUDENT" | "INSTRUCTOR" | "ADMIN";
    isActive: boolean;
}

export interface UpdateProfileRequest {
    fullName?: string;
    bio?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface CreateUserRequest {
    fullName: string;
    email: string;
    roleName: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}
