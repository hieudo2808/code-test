import api from "./api";

export interface NotificationItem {
    notificationId: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string | number;
}

export interface CreateNotificationRequest {
    title: string;
    message: string;
    targetEmails?: string[];
}

export interface SendEmailRequest {
    toEmails: string[];
    subject: string;
    body: string;
}

export const notificationService = {
    async getMyNotifications(page = 0, size = 20): Promise<{
        content: NotificationItem[];
        totalElements: number;
        totalPages: number;
    }> {
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

    // Admin endpoints
    async sendNotification(request: CreateNotificationRequest): Promise<NotificationItem> {
        const response = await api.post("/notifications/send", request);
        return response.data.result;
    },

    async sendEmail(request: SendEmailRequest): Promise<void> {
        await api.post("/notifications/send-email", request);
    },
};
