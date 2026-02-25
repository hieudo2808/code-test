import api from "./api";

const STORAGE_KEY = "codejudge_user";

export enum UserRole {
    STUDENT = "student",
    INSTRUCTOR = "instructor",
    ADMIN = "admin",
}

// User interface matching frontend expectations
export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
    bio?: string;
    isActive: boolean;
    createdAt?: string;
}

// API response from backend
interface ApiUserResponse {
    userId: string;
    fullName: string;
    email: string;
    roleName: string;
    avatarUrl?: string;
    bio?: string;
    isActive: boolean;
    createdAt?: string;
}

// Normalize backend response to frontend User format
function normalizeUser(apiUser: ApiUserResponse): User {
    const roleMap: Record<string, UserRole> = {
        STUDENT: UserRole.STUDENT,
        INSTRUCTOR: UserRole.INSTRUCTOR,
        ADMIN: UserRole.ADMIN,
    };

    return {
        id: apiUser.userId,
        name: apiUser.fullName,
        email: apiUser.email,
        role: roleMap[apiUser.roleName?.toUpperCase()] || UserRole.STUDENT,
        avatarUrl: apiUser.avatarUrl,
        bio: apiUser.bio,
        isActive: apiUser.isActive,
        createdAt: apiUser.createdAt,
    };
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    error?: string;
}

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await api.post("/auth/login", credentials);
            const result = response.data.result;
            const apiUser = result?.user;
            if (!apiUser) {
                return { success: false, error: "Login failed" };
            }
            if (apiUser.isActive === false) {
                return { success: false, error: "Tài khoản đã bị vô hiệu hóa" };
            }
            const user = normalizeUser(apiUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            localStorage.setItem("token", result.token);
            return { success: true, user };
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || "Đăng nhập thất bại";
            return { success: false, error: message };
        }
    },

    async register(data: RegisterData): Promise<AuthResponse> {
        try {
            const response = await api.post("/auth/register", {
                fullName: data.name,
                email: data.email,
                password: data.password,
            });
            const result = response.data.result;
            const apiUser = result?.user;
            if (!apiUser) {
                return { success: false, error: "Registration failed" };
            }
            if (apiUser.isActive === false) {
                return { success: false, error: "Tài khoản đã bị vô hiệu hóa" };
            }
            const user = normalizeUser(apiUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            localStorage.setItem("token", result.token);
            return { success: true, user };
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || "Đăng ký thất bại";
            return { success: false, error: message };
        }
    },

    logout(): void {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("token");
        api.post("/auth/logout").catch(() => {});
    },

    getCurrentUser(): User | null {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored) as User;
            } catch {
                return null;
            }
        }
        return null;
    },

    isAuthenticated(): boolean {
        return this.getCurrentUser() !== null;
    },
};
