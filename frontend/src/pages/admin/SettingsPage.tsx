import { useState, useEffect } from "react";
import { Settings, Shield, Clock, Server, Save, Loader2, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";
import { settingsService, type SystemSettingsMap } from "~/services/settingsService";

interface SettingField {
    key: string;
    label: string;
    description: string;
    type: "text" | "number" | "toggle";
    suffix?: string;
}

const GENERAL_SETTINGS: SettingField[] = [
    {
        key: "maintenance.mode",
        label: "Maintenance Mode",
        description: "When enabled, the platform will show a maintenance page to all users except admins.",
        type: "toggle",
    },
    {
        key: "max.upload.size",
        label: "Max Upload Size",
        description: "Maximum file upload size allowed (in bytes).",
        type: "number",
        suffix: "bytes",
    },
];

const SECURITY_SETTINGS: SettingField[] = [
    {
        key: "jwt.expiration",
        label: "JWT Expiration",
        description: "How long a JWT token stays valid (in milliseconds).",
        type: "number",
        suffix: "ms",
    },
    {
        key: "rate.limit.requests",
        label: "Rate Limit — Max Requests",
        description: "Maximum number of API requests allowed within the rate limit window.",
        type: "number",
    },
    {
        key: "rate.limit.window.seconds",
        label: "Rate Limit — Window",
        description: "Duration of the rate limit window (in seconds).",
        type: "number",
        suffix: "seconds",
    },
];

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(0)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
}

export function SettingsPage() {
    const [settings, setSettings] = useState<SystemSettingsMap>({});
    const [originalSettings, setOriginalSettings] = useState<SystemSettingsMap>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await settingsService.getAllSettings();
            setSettings(data);
            setOriginalSettings(data);
        } catch {
            setError("Failed to load settings. Make sure the SystemSettings table exists and is seeded.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setSuccess("");
    };

    const handleToggle = (key: string) => {
        setSettings((prev) => ({
            ...prev,
            [key]: prev[key] === "true" ? "false" : "true",
        }));
        setSuccess("");
    };

    const hasChanges = (): boolean => {
        return Object.keys(settings).some((key) => settings[key] !== originalSettings[key]);
    };

    const getChangedSettings = (): SystemSettingsMap => {
        const changed: SystemSettingsMap = {};
        Object.keys(settings).forEach((key) => {
            if (settings[key] !== originalSettings[key]) {
                changed[key] = settings[key];
            }
        });
        return changed;
    };

    const handleSave = async () => {
        const changed = getChangedSettings();
        if (Object.keys(changed).length === 0) return;

        setSaving(true);
        setError("");
        setSuccess("");
        try {
            await settingsService.updateSettings(changed);
            setOriginalSettings({ ...settings });
            setSuccess("Settings saved successfully.");
        } catch {
            setError("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setSettings({ ...originalSettings });
        setSuccess("");
        setError("");
    };

    const renderField = (field: SettingField) => {
        const value = settings[field.key] ?? "";

        if (field.type === "toggle") {
            const isOn = value === "true";
            return (
                <div key={field.key} className="flex items-center justify-between py-4 border-b border-[var(--border-color)] last:border-0">
                    <div className="flex-1 mr-4">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{field.label}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{field.description}</p>
                    </div>
                    <button
                        onClick={() => handleToggle(field.key)}
                        className="flex-shrink-0 transition-colors"
                        title={isOn ? "Disable" : "Enable"}
                    >
                        {isOn ? (
                            <ToggleRight className="w-8 h-8 text-green-500" />
                        ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-400" />
                        )}
                    </button>
                </div>
            );
        }

        return (
            <div key={field.key} className="py-4 border-b border-[var(--border-color)] last:border-0">
                <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-[var(--text-primary)]">{field.label}</label>
                    {field.key === "max.upload.size" && value && (
                        <span className="text-xs text-[var(--text-secondary)]">
                            ≈ {formatBytes(Number(value))}
                        </span>
                    )}
                    {field.key === "jwt.expiration" && value && (
                        <span className="text-xs text-[var(--text-secondary)]">
                            ≈ {formatDuration(Number(value))}
                        </span>
                    )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-2">{field.description}</p>
                <div className="flex items-center gap-2">
                    <input
                        type={field.type === "number" ? "number" : "text"}
                        value={value}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    />
                    {field.suffix && (
                        <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">{field.suffix}</span>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">System Settings</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Manage platform configuration and security settings.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        disabled={!hasChanges()}
                        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges() || saving}
                        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-3 text-sm rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-3 text-sm rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
                    {success}
                </div>
            )}

            {/* General Settings */}
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border-color)]">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-[var(--text-primary)]">General</h2>
                        <p className="text-xs text-[var(--text-secondary)]">Platform-wide configuration</p>
                    </div>
                </div>
                <div className="px-6">
                    {GENERAL_SETTINGS.map(renderField)}
                </div>
            </div>

            {/* Security Settings */}
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border-color)]">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                        <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-[var(--text-primary)]">Security</h2>
                        <p className="text-xs text-[var(--text-secondary)]">Authentication and rate limiting</p>
                    </div>
                </div>
                <div className="px-6">
                    {SECURITY_SETTINGS.map(renderField)}
                </div>
            </div>

            {/* System Info (read-only) */}
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border-color)]">
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-[var(--text-primary)]">System Info</h2>
                        <p className="text-xs text-[var(--text-secondary)]">Read-only runtime information</p>
                    </div>
                </div>
                <div className="px-6 py-4 space-y-3">
                    <InfoRow label="Environment" value={import.meta.env.MODE} />
                    <InfoRow label="API Base URL" value={import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"} />
                    <InfoRow label="Frontend Build" value={`Vite ${import.meta.env.VITE_APP_VERSION || "dev"}`} />
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
            <span className="text-sm text-[var(--text-secondary)]">{label}</span>
            <span className="text-sm font-mono text-[var(--text-primary)]">{value}</span>
        </div>
    );
}
