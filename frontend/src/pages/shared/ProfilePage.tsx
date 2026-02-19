import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardBody } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
    User,
    Camera,
    Save,
    Lock,
    Loader2,
    Eye,
    EyeOff,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import { useAuth } from "~/contexts/AuthContext";
import {
    userService,
    type UpdateProfileRequest,
    type ChangePasswordRequest,
} from "~/services/userService";

export function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile form
    const [fullName, setFullName] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Avatar upload
    const [avatarUploading, setAvatarUploading] = useState(false);

    // Password form
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (user) {
            setFullName(user.name || "");
            setBio(user.bio || "");
            setAvatarUrl(user.avatarUrl);
        }
    }, [user]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith("image/")) {
            setProfileMessage({ type: "error", text: "Please select an image file." });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setProfileMessage({ type: "error", text: "Image must be less than 5MB." });
            return;
        }

        try {
            setAvatarUploading(true);
            setProfileMessage(null);
            const newUrl = await userService.updateMyAvatar(file);
            setAvatarUrl(newUrl);
            await refreshUser();
            setProfileMessage({ type: "success", text: "Avatar updated successfully!" });
        } catch {
            setProfileMessage({ type: "error", text: "Failed to upload avatar." });
        } finally {
            setAvatarUploading(false);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName.trim()) {
            setProfileMessage({ type: "error", text: "Full name is required." });
            return;
        }

        try {
            setProfileLoading(true);
            setProfileMessage(null);
            const data: UpdateProfileRequest = {
                fullName: fullName.trim(),
                bio: bio.trim() || undefined,
            };
            await userService.updateMyProfile(data);
            await refreshUser();
            setProfileMessage({ type: "success", text: "Profile updated successfully!" });
        } catch {
            setProfileMessage({ type: "error", text: "Failed to update profile." });
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMessage({ type: "error", text: "All fields are required." });
            return;
        }
        if (newPassword.length < 8) {
            setPasswordMessage({ type: "error", text: "New password must be at least 8 characters." });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: "error", text: "Passwords do not match." });
            return;
        }

        try {
            setPasswordLoading(true);
            const data: ChangePasswordRequest = {
                currentPassword,
                newPassword,
            };
            await userService.changePassword(data);
            setPasswordMessage({ type: "success", text: "Password changed successfully!" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            setPasswordMessage({ type: "error", text: "Failed to change password. Check your current password." });
        } finally {
            setPasswordLoading(false);
        }
    };

    const getRoleLabel = (role?: string) => {
        switch (role) {
            case "student": return "Student";
            case "instructor": return "Instructor";
            case "admin": return "Admin";
            default: return "";
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-(--text-primary) mb-1">Profile</h1>
                <p className="text-(--text-secondary)">Manage your account information.</p>
            </div>

            {/* Avatar & Profile Info */}
            <Card>
                <CardHeader>
                    <h3 className="text-(--text-primary)">Profile Information</h3>
                </CardHeader>
                <CardBody>
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                        {/* Avatar */}
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={avatarUploading}
                                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                    {avatarUploading ? (
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    ) : (
                                        <Camera className="w-6 h-6 text-white" />
                                    )}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                />
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-(--text-primary) font-semibold text-lg">
                                    {user?.name || "User"}
                                </h3>
                                <p className="text-(--text-secondary) text-sm">{user?.email}</p>
                                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                    {getRoleLabel(user?.role)}
                                </span>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-(--text-primary) mb-1.5">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-3 py-2 border border-(--border-color) rounded-lg bg-(--bg-app) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Your full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-(--text-primary) mb-1.5">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={user?.email || ""}
                                    disabled
                                    className="w-full px-3 py-2 border border-(--border-color) rounded-lg bg-(--bg-tertiary) text-(--text-secondary) cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-(--text-primary) mb-1.5">
                                    Bio
                                </label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-(--border-color) rounded-lg bg-(--bg-app) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>
                        </div>

                        {profileMessage && (
                            <div
                                className={`flex items-center gap-2 text-sm ${
                                    profileMessage.type === "success"
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                }`}
                            >
                                {profileMessage.type === "success" ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : (
                                    <AlertCircle className="w-4 h-4" />
                                )}
                                {profileMessage.text}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={profileLoading}>
                                {profileLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>

            {/* Change Password */}
            <Card>
                <CardHeader>
                    <h3 className="text-(--text-primary) flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Change Password
                    </h3>
                </CardHeader>
                <CardBody>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-(--text-primary) mb-1.5">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-3 py-2 pr-10 border border-(--border-color) rounded-lg bg-(--bg-app) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-secondary) hover:text-(--text-primary)"
                                >
                                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-(--text-primary) mb-1.5">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 pr-10 border border-(--border-color) rounded-lg bg-(--bg-app) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Enter new password (min. 8 chars)"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--text-secondary) hover:text-(--text-primary)"
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-(--text-primary) mb-1.5">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-(--border-color) rounded-lg bg-(--bg-app) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="Confirm new password"
                            />
                        </div>

                        {passwordMessage && (
                            <div
                                className={`flex items-center gap-2 text-sm ${
                                    passwordMessage.type === "success"
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                }`}
                            >
                                {passwordMessage.type === "success" ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : (
                                    <AlertCircle className="w-4 h-4" />
                                )}
                                {passwordMessage.text}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" variant="outline" disabled={passwordLoading}>
                                {passwordLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Lock className="w-4 h-4 mr-2" />
                                )}
                                Change Password
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
}
