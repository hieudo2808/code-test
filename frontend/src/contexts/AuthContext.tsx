import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
    authService,
    type User,
    type LoginCredentials,
    type RegisterData,
    type UserRole,
} from "~/services/authService";
import { userService } from "~/services/userService";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
    register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    hasRole: (roles: UserRole | UserRole[]) => boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setIsLoading(false);
    }, []);

    const login = useCallback(async (credentials: LoginCredentials) => {
        const response = await authService.login(credentials);
        if (response.success && response.user) {
            setUser(response.user);
            return { success: true };
        }
        return { success: false, error: response.error };
    }, []);

    const register = useCallback(async (data: RegisterData) => {
        const response = await authService.register(data);
        if (response.success && response.user) {
            setUser(response.user);
            return { success: true };
        }
        return { success: false, error: response.error };
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const profile = await userService.getMyProfile();
            const roleMap: Record<string, string> = {
                STUDENT: "student",
                INSTRUCTOR: "instructor",
                ADMIN: "admin",
            };
            const updated: User = {
                id: profile.userId,
                name: profile.fullName,
                email: profile.email,
                role: (roleMap[profile.roleName?.toUpperCase()] || "student") as UserRole,
                avatarUrl: profile.avatarUrl,
                bio: profile.bio,
                isActive: profile.isActive,
                createdAt: profile.createdAt,
            };
            setUser(updated);
            localStorage.setItem("codejudge_user", JSON.stringify(updated));
        } catch (error) {
            console.error("Failed to refresh user:", error);
        }
    }, []);

    const hasRole = useCallback(
        (roles: UserRole | UserRole[]) => {
            if (!user) return false;
            const roleArray = Array.isArray(roles) ? roles : [roles];
            return roleArray.includes(user.role);
        },
        [user]
    );

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
