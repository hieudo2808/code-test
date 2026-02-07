import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

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
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
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
