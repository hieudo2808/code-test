import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, UserRole } from "~/lib/mock-data";
import { authService, type LoginCredentials, type RegisterData } from "~/services/authService";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
    register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session on mount
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setIsLoading(false);
    }, []);

    const login = useCallback(async (credentials: LoginCredentials) => {
        const response = authService.login(credentials);
        if (response.success && response.user) {
            setUser(response.user);
            return { success: true };
        }
        return { success: false, error: response.error };
    }, []);

    const register = useCallback(async (data: RegisterData) => {
        const response = authService.register(data);
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
