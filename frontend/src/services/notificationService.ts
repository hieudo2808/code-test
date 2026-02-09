import api from "./api";

export interface Notification {
    notificationId: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export const notificationService = {
    async getNotifications(page = 0, size = 20) {
        const response = await api.get(`/notifications?page=${page}&size=${size}`);
        return response.data.result;
    },

    async getUnreadCount(): Promise<number> {
        const response = await api.get("/notifications/unread-count");
        return response.data.result.count;
    },

    async markAsRead(notificationId: string): Promise<void> {
        await api.post(`/notifications/${notificationId}/read`);
    },

    async markAllAsRead(): Promise<void> {
        await api.post("/notifications/mark-all-read");
    },
};
