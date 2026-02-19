import api from "./api";

export interface SystemSettingsMap {
    [key: string]: string;
}

export const settingsService = {
    async getAllSettings(): Promise<SystemSettingsMap> {
        const response = await api.get("/admin/settings");
        return response.data.result;
    },

    async getSetting(key: string): Promise<string> {
        const response = await api.get(`/admin/settings/${key}`);
        return response.data.result;
    },

    async updateSettings(settings: SystemSettingsMap): Promise<SystemSettingsMap> {
        const response = await api.put("/admin/settings", settings);
        return response.data.result;
    },
};
