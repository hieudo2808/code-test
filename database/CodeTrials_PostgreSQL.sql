-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Authentication and Authorization Tables
-- ============================================

CREATE TABLE Roles (
    roleId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roleName VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO Roles (roleName) VALUES ('STUDENT'), ('INSTRUCTOR'), ('ADMIN');

CREATE TABLE Permission (
    permissionId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permissionName VARCHAR(50) NOT NULL UNIQUE,
    descriptions VARCHAR(200)
);

-- Insert permissions using CTE
WITH permissionsData (permissionName, descriptions) AS (
    VALUES 
    -- User Management
    ('USER_READ', 'Xem thông tin người dùng công khai'),
    ('USER_UPDATE_SELF', 'Cập nhật profile cá nhân'),
    ('USER_MANAGE', 'Quản lý người dùng (Ban, Unban, Promote) - Admin only'),

    -- Problem Management
    ('PROBLEM_READ', 'Xem danh sách và chi tiết bài tập'),
    ('PROBLEM_CREATE', 'Tạo bài tập mới'),
    ('PROBLEM_UPDATE', 'Chỉnh sửa bài tập'),
    ('PROBLEM_DELETE', 'Xóa bài tập'),

    -- Contest Management
    ('CONTEST_READ', 'Xem danh sách cuộc thi'),
    ('CONTEST_JOIN', 'Tham gia cuộc thi'),
    ('CONTEST_CREATE', 'Tạo cuộc thi'),
    ('CONTEST_UPDATE', 'Chỉnh sửa cuộc thi'),
    ('CONTEST_DELETE', 'Xóa cuộc thi'),

    -- Testcase
    ('TESTCASE_CREATE', 'Tạo test case cho bài tập'),
    ('TESTCASE_UPDATE', 'Chỉnh sửa test case'),
    ('TESTCASE_DELETE', 'Xóa test case'),
    ('TESTCASE_READ_HIDDEN', 'Xem test case ẩn (hidden testcases)'),

    -- Submission & Review
    ('SUBMISSION_CREATE', 'Nộp bài (Submit code)'),
    ('SUBMISSION_READ_SELF', 'Xem lịch sử nộp bài của bản thân'),
    ('SUBMISSION_READ_ALL', 'Xem bài nộp của tất cả học sinh (để chấm/soi code)'),
    ('SUBMISSION_REJUDGE', 'Chạy lại bài nộp (Rejudge)'),
    ('SUBMISSION_REVIEW', 'Chấm bài thủ công hoặc review code'),

    -- System / Judge
    ('SYSTEM_CONFIG', 'Cấu hình hệ thống / Judge / Ngôn ngữ')
)
INSERT INTO Permission (permissionName, descriptions)
SELECT permissionName, descriptions
FROM permissionsData
WHERE NOT EXISTS (
    SELECT 1 FROM Permission WHERE Permission.permissionName = permissionsData.permissionName
);

CREATE TABLE RolePermissions (
    roleId UUID NOT NULL REFERENCES Roles(roleId) ON DELETE CASCADE,
    permissionId UUID NOT NULL REFERENCES Permission(permissionId) ON DELETE CASCADE,
    PRIMARY KEY (roleId, permissionId)
);

-- Assign permission for STUDENT
INSERT INTO RolePermissions (roleId, permissionId)
SELECT r.roleId, p.permissionId
FROM Roles r
CROSS JOIN Permission p
WHERE r.roleName = 'STUDENT'
  AND p.permissionName IN (
      'USER_READ', 'USER_UPDATE_SELF',
      'PROBLEM_READ',
      'CONTEST_READ', 'CONTEST_JOIN',
      'SUBMISSION_CREATE', 'SUBMISSION_READ_SELF'
  )
ON CONFLICT (roleId, permissionId) DO NOTHING;

-- Assign permission for INSTRUCTOR
INSERT INTO RolePermissions (roleId, permissionId)
SELECT r.roleId, p.permissionId
FROM Roles r
CROSS JOIN Permission p
WHERE r.roleName = 'INSTRUCTOR'
  AND p.permissionName IN (
      -- Basic Rights
      'USER_READ', 'USER_UPDATE_SELF',
      -- Problem Rights (Full)
      'PROBLEM_READ', 'PROBLEM_CREATE', 'PROBLEM_UPDATE', 'PROBLEM_DELETE',
      'TESTCASE_CREATE', 'TESTCASE_UPDATE', 'TESTCASE_DELETE', 'TESTCASE_READ_HIDDEN',
      -- Contest Rights (Full)
      'CONTEST_READ', 'CONTEST_JOIN', 'CONTEST_CREATE', 'CONTEST_UPDATE', 'CONTEST_DELETE',
      -- Submission Rights (Advanced)
      'SUBMISSION_CREATE', 'SUBMISSION_READ_SELF', 'SUBMISSION_READ_ALL', 'SUBMISSION_REVIEW', 'SUBMISSION_REJUDGE'
  )
ON CONFLICT (roleId, permissionId) DO NOTHING;

-- Assign ALL permissions for ADMIN
INSERT INTO RolePermissions (roleId, permissionId)
SELECT r.roleId, p.permissionId
FROM Roles r
CROSS JOIN Permission p
WHERE r.roleName = 'ADMIN'
ON CONFLICT (roleId, permissionId) DO NOTHING;

CREATE TABLE InvalidateToken (
    tokenId UUID PRIMARY KEY,
    invalidateAt TIMESTAMPTZ
);

CREATE TABLE Users (
    userId UUID PRIMARY KEY,
    fullName VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    hashPassword VARCHAR(255) NOT NULL,
    avatarUrl VARCHAR(255),
    bio VARCHAR(500),
    roleId UUID NOT NULL REFERENCES Roles(roleId) ON DELETE RESTRICT,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    isActive BOOLEAN DEFAULT TRUE,
    failedLoginAttempts INT NOT NULL DEFAULT 0,
    lockUntil TIMESTAMPTZ,
    -- Email Verification
    emailVerified BOOLEAN DEFAULT FALSE,
    emailVerificationToken VARCHAR(255),
    emailVerificationExpires TIMESTAMPTZ,
    -- Password Reset
    passwordResetToken VARCHAR(255),
    passwordResetExpires TIMESTAMPTZ,
    -- Admin Management
    bannedReason VARCHAR(500),
    bannedAt TIMESTAMPTZ,
    bannedBy UUID
);

-- Notifications System (n-n relationship)
CREATE TYPE notificationType AS ENUM ('CONTEST_START', 'SUBMISSION_RESULT', 'ANNOUNCEMENT', 'SYSTEM', 'MENTION');
CREATE TYPE referenceType AS ENUM ('CONTEST', 'PROBLEM', 'SUBMISSION', 'USER');

CREATE TABLE Notifications (
    notificationId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    message TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for User-Notification (tracks read status per user)
CREATE TABLE UserNotifications (
    userId UUID NOT NULL REFERENCES Users(userId) ON DELETE CASCADE,
    notificationId UUID NOT NULL REFERENCES Notifications(notificationId) ON DELETE CASCADE,
    isRead BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (userId, notificationId)
);

CREATE INDEX IX_UserNotifications_User ON UserNotifications(userId, isRead);
CREATE INDEX IX_Notifications_Type ON Notifications(notificationType, createdAt DESC);

-- ============================================
-- Problems & Contests Tables
-- ============================================

-- Custom ENUM types for PostgreSQL
CREATE TYPE evaluationType AS ENUM ('EXACT', 'HEURISTIC', 'MANUAL');
CREATE TYPE difficultyLevel AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE submissionStatus AS ENUM ('PENDING', 'COMPILING', 'RUNNING', 'EVALUATING', 'NEED_REVIEW', 'DONE', 'ERROR');
CREATE TYPE verdictType AS ENUM ('ACCEPTED', 'PARTIAL', 'FAILED', 'COMPILE_ERROR', 'RUNTIME_ERROR', 'TIME_LIMIT', 'MEMORY_LIMIT', 'SCORED', 'MANUAL');

CREATE TABLE Contests (
    contestId UUID PRIMARY KEY NOT NULL,
    contestName VARCHAR(200) NOT NULL,
    contestOwner UUID REFERENCES Users(userId) ON DELETE SET NULL,
    startTime TIMESTAMPTZ,
    endTime TIMESTAMPTZ,
    isPublic BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE Problems (
    problemId UUID PRIMARY KEY,
    problemCreator UUID REFERENCES Users(userId) ON DELETE SET NULL,
    title VARCHAR(200),
    slug VARCHAR(250) UNIQUE,
    problemDescription TEXT,
    evaluationType evaluationType NOT NULL,
    timeLimit DOUBLE PRECISION DEFAULT 0, -- seconds
    memoryLimit INT DEFAULT 0, -- kB
    difficulty difficultyLevel,
    sampleInput TEXT,
    sampleOutput TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ContestProblems (
    contestId UUID NOT NULL REFERENCES Contests(contestId) ON DELETE CASCADE,
    problemId UUID NOT NULL REFERENCES Problems(problemId) ON DELETE RESTRICT,
    maxSubmissions INT,
    PRIMARY KEY (contestId, problemId)
);

CREATE TABLE ContestParticipants (
    contestId UUID NOT NULL REFERENCES Contests(contestId) ON DELETE CASCADE,
    participantId UUID NOT NULL REFERENCES Users(userId) ON DELETE CASCADE,
    joinedAt TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (contestId, participantId)
);

-- ============================================
-- Testcases & Submissions Tables
-- ============================================

CREATE TABLE Testcases (
    testcaseId UUID PRIMARY KEY,
    problemId UUID NOT NULL REFERENCES Problems(problemId) ON DELETE CASCADE,
    input TEXT,
    expectedOutput TEXT,
    testcasePoint DOUBLE PRECISION,
    isHidden BOOLEAN DEFAULT FALSE
);

CREATE TABLE Submissions (
    submissionId UUID NOT NULL PRIMARY KEY,
    submissionToken VARCHAR(50) UNIQUE,
    submitterId UUID REFERENCES Users(userId) ON DELETE SET NULL,
    problemId UUID NOT NULL REFERENCES Problems(problemId) ON DELETE CASCADE,
    contestId UUID REFERENCES Contests(contestId) ON DELETE SET NULL,
    sourceCode TEXT NOT NULL,
    codeLanguage VARCHAR(16) NOT NULL,
    languageId INT NOT NULL,
    submissionStatus submissionStatus NOT NULL,
    finalScore DOUBLE PRECISION,
    finalVerdict verdictType,
    createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Results Tables
-- ============================================

CREATE TABLE SubmissionResults (
    submissionResultId UUID NOT NULL PRIMARY KEY,
    submissionId UUID NOT NULL REFERENCES Submissions(submissionId) ON DELETE CASCADE,
    testcaseId UUID NOT NULL REFERENCES Testcases(testcaseId) ON DELETE RESTRICT,
    UNIQUE (submissionId, testcaseId),
    stdout TEXT,
    stderr TEXT,
    timeMs DOUBLE PRECISION,
    memoryKb DOUBLE PRECISION,
    score DOUBLE PRECISION,
    verdict verdictType
);

CREATE TABLE ManualReview (
    manualReviewId UUID NOT NULL PRIMARY KEY,
    submissionId UUID REFERENCES Submissions(submissionId) ON DELETE SET NULL,
    reviewerId UUID REFERENCES Users(userId) ON DELETE SET NULL,
    verdict verdictType,
    score DOUBLE PRECISION,
    comment TEXT,
    reviewedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Plagiarism Detection Table
-- ============================================

CREATE TABLE PlagiarismChecks (
    checkId UUID PRIMARY KEY NOT NULL,
    submission1Id UUID NOT NULL REFERENCES Submissions(submissionId) ON DELETE CASCADE,
    submission2Id UUID NOT NULL REFERENCES Submissions(submissionId) ON DELETE RESTRICT,
    CHECK (submission1Id < submission2Id),
    UNIQUE (submission1Id, submission2Id),
    similarityScore DOUBLE PRECISION,
    lexicalScore DOUBLE PRECISION,
    astScore DOUBLE PRECISION,
    cfgScore DOUBLE PRECISION,
    verdict VARCHAR(20) CHECK (verdict IN ('CLEAN', 'SUSPICIOUS', 'PLAGIARIZED')),
    checkedAt TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- System Settings Table
-- ============================================

CREATE TABLE SystemSettings (
    settingKey VARCHAR(100) NOT NULL PRIMARY KEY,
    settingValue TEXT,
    description TEXT,
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings
INSERT INTO SystemSettings (settingKey, settingValue, description) VALUES
('jwt.expiration', '604800000', 'JWT token expiration time in milliseconds (default: 24 hours)'),
('maintenance.mode', 'false', 'Enable or disable maintenance mode (true/false)'),
('max.upload.size', '57671680', 'Maximum file upload size in bytes (default: 10 MB)'),
('rate.limit.requests', '200', 'Maximum number of requests allowed per rate limit window'),
('rate.limit.window.seconds', '60', 'Rate limit window duration in seconds'),
('plagiarism.winnowing.k', '15', 'K-gram size for Winnowing algorithm (default: 15)'),
('plagiarism.winnowing.w', '5', 'Window size for Winnowing algorithm (default: 5)'),
('plagiarism.threshold', '85', 'Similarity percentage threshold to flag plagiarism (default: 85)');

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IX_Submissions_User ON Submissions(submitterId);
CREATE INDEX IX_Submissions_Problem ON Submissions(problemId);
CREATE INDEX IX_SubmissionResults_Submission ON SubmissionResults(submissionId);
CREATE INDEX IX_ContestParticipants_User ON ContestParticipants(participantId);
CREATE INDEX IX_ContestProblems_Problem ON ContestProblems(problemId);
CREATE INDEX IX_Submissions_Contest ON Submissions(contestId, finalVerdict);
CREATE INDEX IX_Problems_Difficulty ON Problems(difficulty);
CREATE INDEX IX_Submissions_Status ON Submissions(submissionStatus);
CREATE INDEX IX_Contests_Time ON Contests(startTime, endTime);
CREATE INDEX IX_Users_Role ON Users(roleId) WHERE isActive = TRUE;
CREATE INDEX IX_Submissions_CreatedAt ON Submissions(createdAt DESC);

-- ============================================
-- Trigger for auto-update updatedAt column
-- ============================================

CREATE OR REPLACE FUNCTION updateUpdatedAtColumn()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER updateContestsUpdatedAt
    BEFORE UPDATE ON Contests
    FOR EACH ROW
    EXECUTE FUNCTION updateUpdatedAtColumn();

CREATE TRIGGER updateProblemsUpdatedAt
    BEFORE UPDATE ON Problems
    FOR EACH ROW
    EXECUTE FUNCTION updateUpdatedAtColumn();

CREATE TRIGGER updateSubmissionsUpdatedAt
    BEFORE UPDATE ON Submissions
    FOR EACH ROW
    EXECUTE FUNCTION updateUpdatedAtColumn();
