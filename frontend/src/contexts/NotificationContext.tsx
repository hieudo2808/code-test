import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "./AuthContext";
import { notificationService, type NotificationItem } from "~/services/notificationService";

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "http://localhost:8080/ws";

interface NotificationContextType {
    notifications: NotificationItem[];
    unreadCount: number;
    isConnected: boolean;
    fetchNotifications: (page?: number) => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const stompClientRef = useRef<Client | null>(null);

    const refreshUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch {
            // ignore
        }
    }, [isAuthenticated]);

    const fetchNotifications = useCallback(async (page = 0) => {
        if (!isAuthenticated) return;
        try {
            const data = await notificationService.getMyNotifications(page, 20);
            if (page === 0) {
                setNotifications(data.content);
            } else {
                setNotifications(prev => [...prev, ...data.content]);
            }
        } catch {
            // ignore
        }
    }, [isAuthenticated]);

    const markAsRead = useCallback(async (notificationId: string) => {
        await notificationService.markAsRead(notificationId);
        setNotifications(prev =>
            prev.map(n =>
                n.notificationId === notificationId ? { ...n, isRead: true } : n
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const markAllAsRead = useCallback(async () => {
        await notificationService.markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    }, []);

    // WebSocket connection
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(WS_BASE_URL),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            beforeConnect: async () => {
                // Refresh token before each connect/reconnect attempt
                let currentToken = localStorage.getItem("token");
                if (!currentToken) return;

                try {
                    // Decode JWT payload to check expiration
                    const payload = JSON.parse(atob(currentToken.split(".")[1]));
                    const expiresAt = payload.exp * 1000;
                    const now = Date.now();
                    // If token expires within 5 minutes, refresh it
                    if (expiresAt - now < 5 * 60 * 1000) {
                        const { default: api } = await import("~/services/api");
                        const res = await api.post("/auth/refresh");
                        const newToken = res.data.result.token;
                        localStorage.setItem("token", newToken);
                        currentToken = newToken;
                    }
                } catch (err) {
                    console.warn("Failed to refresh token before WS connect:", err);
                }

                // Update connect headers with the (possibly refreshed) token
                client.connectHeaders = {
                    Authorization: `Bearer ${currentToken}`,
                };
            },
            onConnect: () => {
                setIsConnected(true);

                client.subscribe("/user/queue/notifications", (message) => {
                    const notification: NotificationItem = JSON.parse(message.body);
                    setNotifications(prev => [notification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error("STOMP error:", frame.headers["message"]);
                setIsConnected(false);
            },
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
            setIsConnected(false);
        };
    }, [isAuthenticated, user]);

    // Initial fetch
    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications(0);
            refreshUnreadCount();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, fetchNotifications, refreshUnreadCount]);

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        isConnected,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        refreshUnreadCount,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
