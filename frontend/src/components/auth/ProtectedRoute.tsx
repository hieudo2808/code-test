import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "~/contexts/AuthContext";
import { UserRole } from "~/services/authService";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user, hasRole } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login, preserving the intended destination
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access
    if (allowedRoles && !hasRole(allowedRoles)) {
        // Redirect to appropriate dashboard based on user role
        const redirectPath = getDefaultPath(user?.role);
        return <Navigate to={redirectPath} replace />;
    }

    return <>{children}</>;
}

function getDefaultPath(role?: UserRole): string {
    switch (role) {
        case UserRole.ADMIN:
            return "/admin";
        case UserRole.INSTRUCTOR:
            return "/instructor";
        case UserRole.STUDENT:
        default:
            return "/";
    }
}

export function getDefaultPathForRole(role: UserRole): string {
    return getDefaultPath(role);
}
