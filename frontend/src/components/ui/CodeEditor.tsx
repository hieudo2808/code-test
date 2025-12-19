import React from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: string;
    placeholder?: string;
    readOnly?: boolean;
    className?: string;
}

export function CodeEditor({
    value,
    onChange,
    language = "python",
    placeholder = "// Write your code here...",
    readOnly = false,
    className = "",
}: CodeEditorProps) {
    const languageMap: Record<string, string> = {
        python: "python",
        cpp: "cpp",
        java: "java",
        javascript: "javascript",
    };

    const monacoLanguage = languageMap[language] || "python";

    return (
        <div
            className={`bg-[var(--code-bg)] rounded-lg overflow-hidden border border-[var(--border-color)] ${className}`}
        >
            <div className="px-6 py-3 bg-[#1e1e1e] border-b border-gray-700 flex items-center justify-between">
                <span className="text-sm text-gray-400">Language: {language}</span>
            </div>
            <Editor
                height="450px"
                language={monacoLanguage}
                value={value}
                onChange={(value) => onChange(value || "")}
                theme="vs-dark"
                options={{
                    readOnly,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    wordWrap: "on",
                }}
            />
        </div>
    );
}
