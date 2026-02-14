import { useState } from "react";
import { Send, Mail, Bell, Users, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { notificationService } from "~/services/notificationService";

type TabType = "notification" | "email";

export function NotificationPage() {
    const [activeTab, setActiveTab] = useState<TabType>("notification");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Gửi thông báo
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Gửi thông báo hệ thống hoặc email đến người dùng
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setActiveTab("notification")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === "notification"
                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                >
                    <Bell className="w-4 h-4" />
                    Thông báo hệ thống
                </button>
                <button
                    onClick={() => setActiveTab("email")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === "email"
                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                >
                    <Mail className="w-4 h-4" />
                    Gửi email
                </button>
            </div>

            {activeTab === "notification" ? <NotificationTab /> : <EmailTab />}
        </div>
    );
}

function NotificationTab() {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [sendToAll, setSendToAll] = useState(true);
    const [targetEmails, setTargetEmails] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            setResult({ type: "error", message: "Vui lòng nhập đầy đủ tiêu đề và nội dung" });
            return;
        }

        if (!sendToAll && !targetEmails.trim()) {
            setResult({ type: "error", message: "Vui lòng nhập danh sách email người nhận" });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const emails = sendToAll
                ? undefined
                : targetEmails
                      .split(/[,;\n]/)
                      .map(e => e.trim())
                      .filter(e => e.length > 0);

            await notificationService.sendNotification({
                title: title.trim(),
                message: message.trim(),
                targetEmails: emails,
            });

            setResult({ type: "success", message: "Gửi thông báo thành công!" });
            setTitle("");
            setMessage("");
            setTargetEmails("");
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setResult({
                type: "error",
                message: err.response?.data?.message || "Có lỗi xảy ra khi gửi thông báo",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-5">
            {result && (
                <div
                    className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                        result.type === "success"
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                    }`}
                >
                    {result.type === "success" ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    {result.message}
                </div>
            )}

            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Tiêu đề
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề thông báo..."
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                    maxLength={200}
                />
            </div>

            {/* Message */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Nội dung
                </label>
                <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Nhập nội dung thông báo..."
                    rows={5}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                />
            </div>

            {/* Target */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Người nhận
                </label>
                <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            checked={sendToAll}
                            onChange={() => setSendToAll(true)}
                            className="w-4 h-4 text-red-500 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            Tất cả người dùng
                        </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            checked={!sendToAll}
                            onChange={() => setSendToAll(false)}
                            className="w-4 h-4 text-red-500 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            Chọn người nhận
                        </span>
                    </label>
                </div>

                {!sendToAll && (
                    <textarea
                        value={targetEmails}
                        onChange={e => setTargetEmails(e.target.value)}
                        placeholder="Nhập email người nhận, cách nhau bằng dấu phẩy hoặc xuống dòng..."
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                )}
            </div>

            {/* Submit */}
            <div className="flex justify-end">
                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                    Gửi thông báo
                </button>
            </div>
        </div>
    );
}

function EmailTab() {
    const [toEmails, setToEmails] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const handleSend = async () => {
        if (!toEmails.trim() || !subject.trim() || !body.trim()) {
            setResult({ type: "error", message: "Vui lòng nhập đầy đủ thông tin" });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const emails = toEmails
                .split(/[,;\n]/)
                .map(e => e.trim())
                .filter(e => e.length > 0);

            await notificationService.sendEmail({
                toEmails: emails,
                subject: subject.trim(),
                body: body.trim(),
            });

            setResult({ type: "success", message: "Email đã được gửi thành công!" });
            setToEmails("");
            setSubject("");
            setBody("");
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            setResult({
                type: "error",
                message: err.response?.data?.message || "Có lỗi xảy ra khi gửi email",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-5">
            {result && (
                <div
                    className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                        result.type === "success"
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                    }`}
                >
                    {result.type === "success" ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    {result.message}
                </div>
            )}

            {/* To */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Người nhận
                </label>
                <textarea
                    value={toEmails}
                    onChange={e => setToEmails(e.target.value)}
                    placeholder="Nhập email người nhận, cách nhau bằng dấu phẩy hoặc xuống dòng..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                />
            </div>

            {/* Subject */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Tiêu đề
                </label>
                <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Nhập tiêu đề email..."
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                />
            </div>

            {/* Body */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Nội dung
                </label>
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Nhập nội dung email..."
                    rows={8}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Mail className="w-4 h-4" />
                    )}
                    Gửi email
                </button>
            </div>
        </div>
    );
}
