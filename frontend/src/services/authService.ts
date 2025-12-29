import type { User, UserRole } from "~/lib/mock-data";

const STORAGE_KEY = "codejudge_user";

// Mock users for authentication
const mockCredentials: { email: string; password: string; user: User }[] = [
    {
        email: "student@example.com",
        password: "123456",
        user: {
            id: "u1",
            name: "Student User",
            email: "student@example.com",
            role: "student",
            enabled: true,
            solvedProblems: 45,
            totalSubmissions: 123,
        },
    },
    {
        email: "instructor@example.com",
        password: "123456",
        user: {
            id: "u2",
            name: "Instructor User",
            email: "instructor@example.com",
            role: "instructor",
            enabled: true,
        },
    },
    {
        email: "admin@example.com",
        password: "123456",
        user: {
            id: "u3",
            name: "Admin User",
            email: "admin@example.com",
            role: "admin",
            enabled: true,
        },
    },
];

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
    login(credentials: LoginCredentials): AuthResponse {
        const found = mockCredentials.find(
            (c) => c.email === credentials.email && c.password === credentials.password
        );

        if (found) {
            if (!found.user.enabled) {
                return { success: false, error: "Tài khoản đã bị vô hiệu hóa" };
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(found.user));
            return { success: true, user: found.user };
        }

        return { success: false, error: "Email hoặc mật khẩu không đúng" };
    },

    register(data: RegisterData): AuthResponse {
        // Check if email already exists
        const exists = mockCredentials.find((c) => c.email === data.email);
        if (exists) {
            return { success: false, error: "Email đã được sử dụng" };
        }

        // Create new user
        const newUser: User = {
            id: `u${Date.now()}`,
            name: data.name,
            email: data.email,
            role: data.role,
            enabled: true,
            solvedProblems: 0,
            totalSubmissions: 0,
        };

        // Add to mock credentials (in-memory only)
        mockCredentials.push({
            email: data.email,
            password: data.password,
            user: newUser,
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        return { success: true, user: newUser };
    },

    logout(): void {
        localStorage.removeItem(STORAGE_KEY);
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
