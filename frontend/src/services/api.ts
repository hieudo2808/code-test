import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// Global maintenance mode flag
let maintenanceListeners: Array<(enabled: boolean) => void> = [];

export function onMaintenanceChange(listener: (enabled: boolean) => void) {
    maintenanceListeners.push(listener);
    return () => {
        maintenanceListeners = maintenanceListeners.filter((l) => l !== listener);
    };
}

function notifyMaintenance(enabled: boolean) {
    maintenanceListeners.forEach((l) => l(enabled));
}

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers?.set("Authorization", `Bearer ${token}`);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        if (
            response.data &&
            response.data.result &&
            response.data.result.page &&
            Array.isArray(response.data.result.content)
        ) {
            const result = response.data.result;
            Object.assign(result, result.page);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle maintenance mode (503)
        if (error.response?.status === 503) {
            notifyMaintenance(true);
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshResponse = await api.post("/auth/refresh");
                const newToken = refreshResponse.data.result.token;
                localStorage.setItem("token", newToken);

                originalRequest.headers?.set("Authorization", `Bearer ${newToken}`);
                return api.request(originalRequest);
            } catch (err) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;

export async function checkMaintenanceStatus(): Promise<boolean> {
    try {
        const response = await api.get("/maintenance/status");
        return response.data.result?.maintenance === true;
    } catch {
        return false;
    }
}
