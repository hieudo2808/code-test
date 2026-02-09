import api from "./api";

export interface Language {
    id: number;
    name: string;
    extension: string;
    monacoLanguage: string;
}

export const languageService = {
    async getLanguages(): Promise<Language[]> {
        const response = await api.get("/languages");
        return response.data.result;
    },
};
