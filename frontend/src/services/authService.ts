import { User } from "~/lib/mock-data";
import api from "./api";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "codejudge_user";

export enum UserRole {
    STUDENT = "student",
    INSTRUCTOR = "instructor",
    ADMIN = "admin",
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    error?: string;
}

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await api.post("/auth/login", credentials);
        if (!response.data.user.enabled) {
            return { success: false, error: "Tài khoản đã bị vô hiệu hóa" };
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data.user));
        return { success: true, user: response.data.user };
    },

    async register(data: RegisterData): Promise<AuthResponse> {
        // Check if email already exists
        const exists = await api.get("/users/", { params: { email: data.email } });
        if (exists.data.length > 0) {
            return { success: false, error: "Email đã được sử dụng" };
        }

        const response = await api.post("/auth/register", data);
        if (!response.data.user.enabled) {
            return { success: false, error: "Tài khoản đã bị vô hiệu hóa" };
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data.user));
        return { success: true, user: response.data.user };
    },

    logout(): void {
        localStorage.removeItem(STORAGE_KEY);
        api.post("/auth/logout");
        const navigate = useNavigate();
        navigate("/login");
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
