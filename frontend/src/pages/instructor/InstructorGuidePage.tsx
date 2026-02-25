import { useState } from "react";
import { Card, CardHeader, CardBody } from "~/components/ui/card";
import { ArrowLeft, BookOpen, Code2, FileText, Lightbulb } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useNavigate } from "react-router-dom";

const SCORER_TEMPLATES = [
    {
        id: "python",
        name: "Python",
        code: `import sys

def evaluate(input_str, user_output, expected_output):
    # ==========================================
    # TODO: Tự viết logic chấm điểm tại đây
    # Return 2 giá trị: (score: float 0.0 -> 1.0, message: string)
    # ==========================================
    
    if user_output == expected_output:
        return 1.0, "Chính xác!"
    else:
        return 0.0, "Sai kết quả."

if __name__ == '__main__':
    data = sys.stdin.read().strip()
    parts = data.split("---SEPARATOR---")
    
    input_str = parts[0].strip() if len(parts) > 0 else ""
    user_output = parts[1].strip() if len(parts) > 1 else ""
    expected_output = parts[2].strip() if len(parts) > 2 else ""
    
    score, message = evaluate(input_str, user_output, expected_output)
    print(f"score: {score}")
    print(f"message: {message}")`,
    },
    {
        id: "cpp",
        name: "C++",
        code: `#include <iostream>
#include <string>
#include <sstream>

using namespace std;

void evaluate(const string& input_str, const string& user_output, const string& expected_output, double& out_score, string& out_message) {
    // ==========================================
    // TODO: Tự viết logic chấm điểm tại đây
    // Cập nhật giá trị cho out_score (0.0 -> 1.0) và out_message
    // ==========================================
    
    if (user_output == expected_output) {
        out_score = 1.0;
        out_message = "Chính xác!";
    } else {
        out_score = 0.0;
        out_message = "Sai kết quả.";
    }
}

int main() {
    stringstream buffer;
    buffer << cin.rdbuf();
    string data = buffer.str();
    
    string separator = "---SEPARATOR---";
    string input_str = "", user_output = "", expected_output = "";
    
    size_t pos1 = data.find(separator);
    if (pos1 != string::npos) {
        input_str = data.substr(0, pos1);
        
        size_t pos2 = data.find(separator, pos1 + separator.length());
        if (pos2 != string::npos) {
            user_output = data.substr(pos1 + separator.length(), pos2 - pos1 - separator.length());
            expected_output = data.substr(pos2 + separator.length());
        }
    }
    
    // Trim basic whitespaces
    auto trim = [](string& s) {
        s.erase(0, s.find_first_not_of(" \\n\\r\\t"));
        s.erase(s.find_last_not_of(" \\n\\r\\t") + 1);
    };
    trim(input_str); trim(user_output); trim(expected_output);
    
    double score = 0.0;
    string message = "";
    evaluate(input_str, user_output, expected_output, score, message);
    
    cout << "score: " << score << "\\n";
    cout << "message: " << message << "\\n";
    
    return 0;
}`,
    },
    {
        id: "java",
        name: "Java",
        code: `import java.util.Scanner;

public class Main {
    static class Result {
        double score;
        String message;
        Result(double score, String message) {
            this.score = score;
            this.message = message;
        }
    }
    
    public static Result evaluate(String inputStr, String userOutput, String expectedOutput) {
        // ==========================================
        // TODO: Tự viết logic chấm điểm tại đây
        // Trả về object Result(score: 0.0 -> 1.0, message: String)
        // ==========================================
        
        if (userOutput.equals(expectedOutput)) {
            return new Result(1.0, "Chính xác!");
        } else {
            return new Result(0.0, "Sai kết quả.");
        }
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        scanner.useDelimiter("\\\\Z");
        String data = scanner.hasNext() ? scanner.next() : "";
        scanner.close();
        
        String[] parts = data.split("---SEPARATOR---");
        String inputStr = parts.length > 0 ? parts[0].trim() : "";
        String userOutput = parts.length > 1 ? parts[1].trim() : "";
        String expectedOutput = parts.length > 2 ? parts[2].trim() : "";
        
        Result result = evaluate(inputStr, userOutput, expectedOutput);
        System.out.println("score: " + result.score);
        System.out.println("message: " + result.message);
    }
}`,
    },
    {
        id: "javascript",
        name: "Node.js",
        code: `const fs = require('fs');

function evaluate(inputStr, userOutput, expectedOutput) {
    // ==========================================
    // TODO: Tự viết logic chấm điểm tại đây
    // Trả về object: { score: 0.0 -> 1.0, message: string }
    // ==========================================
    
    if (userOutput === expectedOutput) {
        return { score: 1.0, message: "Chính xác!" };
    } else {
        return { score: 0.0, message: "Sai kết quả." };
    }
}

const data = fs.readFileSync(0, 'utf-8').trim();
const parts = data.split('---SEPARATOR---');

const inputStr = parts[0] ? parts[0].trim() : "";
const userOutput = parts[1] ? parts[1].trim() : "";
const expectedOutput = parts[2] ? parts[2].trim() : "";

const result = evaluate(inputStr, userOutput, expectedOutput);
console.log(\`score: \${result.score}\`);
console.log(\`message: \${result.message}\`);`,
    },
    {
        id: "c",
        name: "C",
        code: `#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define MAX_BUF 1000000
char buf[MAX_BUF];

void evaluate(const char* input_str, const char* user_output, const char* expected_output, double* out_score, char* out_message) {
    // ==========================================
    // TODO: Tự viết logic chấm điểm tại đây
    // Cập nhật điểm cho *out_score (0.0 -> 1.0), copy chuỗi vào out_message
    // ==========================================
    
    if (strcmp(user_output, expected_output) == 0) {
        *out_score = 1.0;
        strcpy(out_message, "Chính xác!");
    } else {
        *out_score = 0.0;
        strcpy(out_message, "Sai kết quả.");
    }
}

int main() {
    int len = fread(buf, 1, MAX_BUF - 1, stdin);
    buf[len] = '\\0';

    char *sep = "---SEPARATOR---";
    char *input_str = strtok(buf, sep);
    char *user_output = strtok(NULL, sep);
    char *expected = strtok(NULL, sep);

    if (!input_str) input_str = "";
    if (!user_output) user_output = "";
    if (!expected) expected = "";

    // Trim whitespace đơn giản
    while (*user_output == '\\n' || *user_output == ' ') user_output++;
    while (*expected == '\\n' || *expected == ' ') expected++;

    double score = 0.0;
    char message[256] = "";
    
    evaluate(input_str, user_output, expected, &score, message);

    printf("score: %f\\n", score);
    printf("message: %s\\n", message);
    
    return 0;
}`,
    },
];

export function InstructorGuidePage() {
    const navigate = useNavigate();
    const [selectedLang, setSelectedLang] = useState(SCORER_TEMPLATES[0]);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate("/instructor")}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-(--text-primary) flex items-center gap-2">
                        <BookOpen className="w-6 h-6" />
                        Instructor Guide
                    </h1>
                    <p className="text-(--text-secondary)">
                        Hướng dẫn sử dụng các tính năng dành cho Instructor
                    </p>
                </div>
            </div>

            {/* Table of Contents */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-(--text-primary) flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Mục lục
                    </h2>
                </CardHeader>
                <CardBody>
                    <ol className="list-decimal list-inside space-y-2 text-(--text-secondary)">
                        <li>
                            <a
                                href="#heuristic"
                                className="text-red-500 hover:underline font-medium"
                            >
                                Heuristic — Custom Scorer
                            </a>
                        </li>
                    </ol>
                </CardBody>
            </Card>

            {/* Section 1: Heuristic Scorer */}
            <div id="heuristic">
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-(--text-primary) flex items-center gap-2">
                            <Code2 className="w-5 h-5 text-red-500" />
                            1. Heuristic — Custom Scorer
                        </h2>
                    </CardHeader>
                    <CardBody className="space-y-6">
                        {/* Overview */}
                        <div>
                            <h3 className="font-semibold text-(--text-primary) mb-2">Tổng quan</h3>
                            <p className="text-(--text-secondary) leading-relaxed">
                                Chế độ <strong>Heuristic</strong> cho phép chấm điểm linh hoạt bằng
                                một chương trình scorer tùy chỉnh. Thay vì so sánh chính xác output,
                                hệ thống sẽ chạy scorer code của bạn để đánh giá và cho điểm từng
                                testcase. Phù hợp với các bài toán tối ưu (TSP, scheduling, ...)
                                hoặc bài có nhiều đáp án đúng.
                            </p>
                        </div>

                        {/* How it works */}
                        <div>
                            <h3 className="font-semibold text-(--text-primary) mb-2">
                                Cách hoạt động
                            </h3>
                            <div className="bg-(--bg-secondary) rounded-lg p-4 border border-(--border-color)">
                                <ol className="list-decimal list-inside space-y-2 text-(--text-secondary) text-sm">
                                    <li>
                                        Hệ thống chạy code của thí sinh với input → lấy{" "}
                                        <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                                            user_output
                                        </code>
                                    </li>
                                    <li>
                                        Hệ thống gọi scorer với:{" "}
                                        <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                                            input + user_output + expected_output
                                        </code>
                                    </li>
                                    <li>
                                        Scorer xuất ra{" "}
                                        <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                                            score
                                        </code>{" "}
                                        và{" "}
                                        <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                                            message
                                        </code>
                                    </li>
                                    <li>
                                        Điểm testcase ={" "}
                                        <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                                            score × testcase_point
                                        </code>
                                    </li>
                                </ol>
                            </div>
                        </div>

                        {/* Stdin Format */}
                        <div>
                            <h3 className="font-semibold text-(--text-primary) mb-2">
                                📥 Scorer nhận vào (stdin)
                            </h3>
                            <p className="text-(--text-secondary) text-sm mb-2">
                                Ba phần được nối nhau bởi chuỗi{" "}
                                <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-bold">
                                    ---SEPARATOR---
                                </code>
                            </p>
                            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto leading-relaxed">
                                {`<testcase_input>
---SEPARATOR---
<user_output>
---SEPARATOR---
<expected_output>`}
                            </pre>
                        </div>

                        {/* Stdout Format */}
                        <div>
                            <h3 className="font-semibold text-(--text-primary) mb-2">
                                📤 Scorer xuất ra (stdout)
                            </h3>
                            <p className="text-(--text-secondary) text-sm mb-2">
                                Đúng 2 dòng theo format:
                            </p>
                            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto leading-relaxed">
                                {`score: <số thực từ 0.0 đến 1.0>
message: <thông báo cho thí sinh>`}
                            </pre>
                            <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                                    <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>
                                        <strong>score: 1.0</strong> = điểm tối đa,{" "}
                                        <strong>score: 0.0</strong> = không điểm. Hệ thống sẽ nhân
                                        score với điểm testcase. Ví dụ: score 0.7 × 20 điểm = 14
                                        điểm.
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Example Templates */}
                        <div>
                            <div className="flex items-center justify-between mb-3 border-b border-(--border-color) pb-3">
                                <h3 className="font-semibold text-(--text-primary)">
                                    Mã nguồn mẫu Scorer
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {SCORER_TEMPLATES.map((lang) => (
                                        <button
                                            key={lang.id}
                                            onClick={() => setSelectedLang(lang)}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                                selectedLang.id === lang.id
                                                    ? "bg-blue-600 dark:bg-blue-700 text-white shadow"
                                                    : "bg-(--bg-secondary) text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-tertiary)"
                                            }`}
                                        >
                                            {lang.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-3 rounded-lg mb-4 text-sm flex items-start gap-2 border border-blue-200 dark:border-blue-800/30">
                                <Lightbulb className="w-5 h-5 mt-0.5 shrink-0" />
                                <p>
                                    Bạn chỉ cần tập trung viết logic tính điểm trong hàm{" "}
                                    <strong>evaluate</strong>. Phần code đọc input từ{" "}
                                    <code>stdin</code>, bóc tách các giá trị ban đầu và nối file
                                    template đã được chuẩn bị sẵn một cách gọn gàng.
                                </p>
                            </div>
                            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto leading-relaxed">
                                {selectedLang.code}
                            </pre>
                        </div>

                        {/* Tips */}
                        <div>
                            <h3 className="font-semibold text-(--text-primary) mb-2">💡 Lưu ý</h3>
                            <ul className="list-disc list-inside space-y-1.5 text-(--text-secondary) text-sm">
                                <li>
                                    Scorer chạy với time limit <strong>10 giây</strong> và memory
                                    limit <strong>256 MB</strong>
                                </li>
                                <li>
                                    Separator là chính xác chuỗi{" "}
                                    <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                                        ---SEPARATOR---
                                    </code>{" "}
                                    (15 ký tự)
                                </li>
                                <li>
                                    Output phải bắt đầu bằng{" "}
                                    <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                                        score:
                                    </code>{" "}
                                    — nếu không parse được, điểm = 0
                                </li>
                                <li>Message hiển thị cho thí sinh xem — có thể viết tiếng Việt</li>
                                <li>
                                    Có thể chọn ngôn ngữ cho scorer (C, C++, Java, Python) khi tạo
                                    đề
                                </li>
                            </ul>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
