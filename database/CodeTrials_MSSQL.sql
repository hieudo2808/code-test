IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'CodeTrials')
BEGIN
    CREATE DATABASE CodeTrials
END
GO
USE CodeTrials
GO

-- Authentication and Authorization functions 
CREATE TABLE Roles (
    roleId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    roleName NVARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO Roles (roleName) VALUES ('STUDENT'), ('INSTRUCTOR'), ('ADMIN');

CREATE TABLE Permission (
    permissionId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    permissionName VARCHAR(50) NOT NULL UNIQUE,
    descriptions NVARCHAR(200)
);

DECLARE @Permissions TABLE (permissionName VARCHAR(50), descriptions NVARCHAR(200));
INSERT INTO @Permissions (permissionName, descriptions) VALUES
-- User Management
('USER_READ', N'Xem thông tin người dùng công khai'),
('USER_UPDATE_SELF', N'Cập nhật profile cá nhân'),
('USER_MANAGE', N'Quản lý người dùng (Ban, Unban, Promoto) - Admin only'),

-- Problem Management
('PROBLEM_READ', N'Xem danh sách và chi tiết bài tập'),
('PROBLEM_CREATE', N'Tạo bài tập mới'),
('PROBLEM_UPDATE', N'Chỉnh sửa bài tập'),
('PROBLEM_DELETE', N'Xóa bài tập'),

-- Contest Management
('CONTEST_READ', N'Xem danh sách cuộc thi'),
('CONTEST_JOIN', N'Tham gia cuộc thi'),
('CONTEST_CREATE', N'Tạo cuộc thi'),
('CONTEST_UPDATE', N'Chỉnh sửa cuộc thi'),
('CONTEST_DELETE', N'Xóa cuộc thi'),

--Testcase
('TESTCASE_CREATE', N'Tạo test case cho bài tập'),
('TESTCASE_UPDATE', N'Chỉnh sửa test case'),
('TESTCASE_DELETE', N'Xóa test case'),
('TESTCASE_READ_HIDDEN', N'Xem test case ẩn (hidden testcases)'),

-- Submission & Review
('SUBMISSION_CREATE', N'Nộp bài (Submit code)'),
('SUBMISSION_READ_SELF', N'Xem lịch sử nộp bài của bản thân'),
('SUBMISSION_READ_ALL', N'Xem bài nộp của tất cả học sinh (để chấm/soi code)'),
('SUBMISSION_REJUDGE', N'Chạy lại bài nộp (Rejudge)'),
('SUBMISSION_REVIEW', N'Chấm bài thủ công hoặc review code'),

-- System / Judge
('SYSTEM_CONFIG', N'Cấu hình hệ thống / Judge / Ngôn ngữ');

INSERT INTO Permission (permissionName, descriptions)
SELECT p.permissionName, p.descriptions
FROM @Permissions p
WHERE NOT EXISTS (SELECT 1 FROM Permission WHERE permissionName = p.permissionName);

CREATE TABLE RolePermissions (
    roleId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Roles(roleId) ON DELETE CASCADE,
    permissionId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Permission(permissionId) ON DELETE CASCADE,
    PRIMARY KEY (roleId, permissionId)
);

-- Assign permission for STUDENT
-- Student được: Xem bài, Nộp bài, Xem bài mình, Update profile, Xem/Vào contest
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
  AND NOT EXISTS (SELECT 1 FROM RolePermissions WHERE roleId = r.roleId AND permissionId = p.permissionId);

-- Assign permission for INSTRUCTOR
-- Instructor = Quyền Student + Quản lý bài tập + Quản lý Contest + Xem bài người khác
INSERT INTO RolePermissions (roleId, permissionId)
SELECT r.roleId, p.permissionId
FROM Roles r
CROSS JOIN Permission p
WHERE r.roleName = 'INSTRUCTOR'
  AND p.permissionName IN (
      -- Basic Rights
      'USER_READ', 'USER_UPDATE_SELF',
      -- Problem Rights
      'PROBLEM_READ', 'PROBLEM_CREATE', 'PROBLEM_UPDATE', 'PROBLEM_DELETE',
	  'TESTCASE_CREATE', 'TESTCASE_UPDATE', 'TESTCASE_DELETE', 'TESTCASE_READ_HIDDEN',
      -- Contest Rights
      'CONTEST_READ', 'CONTEST_JOIN', 'CONTEST_CREATE', 'CONTEST_UPDATE', 'CONTEST_DELETE',
      -- Submission Rights
      'SUBMISSION_CREATE', 'SUBMISSION_READ_SELF', 'SUBMISSION_READ_ALL', 'SUBMISSION_REVIEW', 'SUBMISSION_REJUDGE'
  )
  AND NOT EXISTS (SELECT 1 FROM RolePermissions WHERE roleId = r.roleId AND permissionId = p.permissionId);

-- Assign permission for admin
INSERT INTO RolePermissions (roleId, permissionId)
SELECT r.roleId, p.permissionId
FROM Roles r
CROSS JOIN Permission p
WHERE r.roleName = 'ADMIN'
  AND NOT EXISTS (SELECT 1 FROM RolePermissions WHERE roleId = r.roleId AND permissionId = p.permissionId);

CREATE TABLE Users (
    userId UNIQUEIDENTIFIER PRIMARY KEY,
    fullName NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    hashPassword NVARCHAR(255) NOT NULL,
    avatarUrl NVARCHAR(255),
    bio NVARCHAR(500),
    roleId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Roles(roleId) ON DELETE NO ACTION,
    createdAt DATETIMEOFFSET DEFAULT GETDATE(),
    isActive BIT DEFAULT 1,
	failedLoginAttempts INT NOT NULL DEFAULT 0,
    lockUntil DATETIMEOFFSET,
	-- Email Verification
	emailVerified BIT DEFAULT 0,
	emailVerificationToken NVARCHAR(255),
	emailVerificationExpires DATETIMEOFFSET,
	-- Password Reset
	passwordResetToken NVARCHAR(255),
	passwordResetExpires DATETIMEOFFSET,
	-- Admin Management
	bannedReason NVARCHAR(500),
	bannedAt DATETIMEOFFSET
);


Create table RefreshToken(
	tokenId UNIQUEIDENTIFIER PRIMARY KEY NOT NULL,
	hashedToken VARCHAR(64) UNIQUE,
	userId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(userId) ON DELETE CASCADE,
	expiresAt DATETIMEOFFSET NOT NULL,
	isRevoked BIT DEFAULT 0 NOT NULL,
	createdAt DATETIMEOFFSET NOT NULL
);

-- Notifications
CREATE TABLE Notifications (
	notificationId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
	title NVARCHAR(200) NOT NULL,
	notificationMessage NVARCHAR(MAX),
	createdAt DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
);

CREATE TABLE UserNotifications (
	userId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(userId) ON DELETE CASCADE,
	notificationId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Notifications(notificationId) ON DELETE CASCADE,
	isRead BIT DEFAULT 0,
	PRIMARY KEY (userId, notificationId)
);

--  Problems & Contests
Create table Contests (
	contestId UNIQUEIDENTIFIER PRIMARY KEY NOT NULL,
	contestName NVARCHAR(200) NOT NULL,
	contestOwner UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(userId) ON DELETE SET NULL, --
	startTime DATETIMEOFFSET,
	endTime DATETIMEOFFSET,
	isPublic BIT DEFAULT 1,
	createAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
	updateAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
)

Create table Problems (
	problemId UNIQUEIDENTIFIER PRIMARY KEY,
	problemCreator UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(userId) ON DELETE SET NULL, --
	title NVARCHAR(200),
	slug VARCHAR(250) UNIQUE,
	problemDescription NVARCHAR(MAX),
	evaluationType VARCHAR(10) NOT NULL CHECK (evaluationType IN ('EXACT', 'HEURISTIC', 'MANUAL')),
	timeLimit FLOAT(53) DEFAULT 0, --second
	memoryLimit INT DEFAULT 0, --kB
	difficulty VARCHAR(6) CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
	sampleInput NVARCHAR(MAX),
	sampleOutput NVARCHAR(MAX),
	createAt DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
    updateAt DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
)

Create table ContestProblems (
	contestId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Contests(contestId) ON DELETE CASCADE,
	problemId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Problems(problemId) ON DELETE NO ACTION,
    maxSubmissions INT,
	PRIMARY KEY (contestId, problemId)
)

Create table ContestParticipants (
	contestId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Contests(contestId) ON DELETE CASCADE,
	participantId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Users(userId) ON DELETE CASCADE,
	joinedAt DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
	PRIMARY KEY (contestId, participantId)
)

--Testcases & Submissions
Create table Testcases (
	testcaseId UNIQUEIDENTIFIER PRIMARY KEY,
	problemId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Problems(problemId) ON DELETE CASCADE,
	input NVARCHAR(MAX),
	expectedOutput NVARCHAR(MAX),
	testcasePoint FLOAT(53),
	isHidden BIT DEFAULT 0
)

Create table Submissions (
	submissionId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
	submissionToken VARCHAR(50) UNIQUE,
	submitterId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(userId) ON DELETE SET NULL,
	problemId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Problems(problemId) ON DELETE CASCADE,
	contestId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Contests(contestId) ON DELETE SET NULL,
	sourceCode NVARCHAR(MAX) NOT NULL,
	codeLanguage VARCHAR(16) NOT NULL,
	languageId INT NOT NULL,
	submissionStatus VARCHAR(20) NOT NULL CHECK (submissionStatus IN ('PENDING', 'COMPILING', 'RUNNING', 'EVALUATING', 'NEED_REVIEW', 'DONE', 'ERROR')),
	finalScore FLOAT(53),
	finalVerdict VARCHAR(20) CHECK (finalVerdict IN ('ACCEPTED', 'PARTIAL', 'FAILED', 'COMPILE_ERROR', 'RUNTIME_ERROR', 'TIME_LIMIT', 'SCORED', 'MANUAL')),
	createAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
	updateAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
)

-- Results
Create table SubmissionResults (
	submissionResultId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
	submissionId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Submissions(submissionId) ON DELETE CASCADE,
	testCaseId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Testcases(testCaseId) ON DELETE NO ACTION,
	UNIQUE(submissionId, testCaseId),
	stdout NVARCHAR(MAX),
	stderr NVARCHAR(MAX),
	timeMs FLOAT(53),
	memoryKb FLOAT(53),
	score FLOAT(53),
    verdict VARCHAR(20) CHECK (verdict IN ('ACCEPTED', 'PARTIAL', 'FAILED', 'COMPILE_ERROR', 'RUNTIME_ERROR', 'TIME_LIMIT', 'SCORED', 'MANUAL'))
)

Create table ManualReview (
	manualReviewId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
	submissionId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Submissions(submissionId) ON DELETE SET NULL,
	reviewerId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(userId) ON DELETE SET NULL,
	verdict VARCHAR(20) CHECK (verdict IN ('ACCEPTED', 'PARTIAL', 'FAILED', 'COMPILE_ERROR', 'RUNTIME_ERROR', 'TIME_LIMIT', 'SCORED', 'MANUAL')),
	score FLOAT(53),
	comment NVARCHAR(MAX),
	reviewedAt DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
)

-- Plagiarism Problems
CREATE TABLE PlagiarismChecks (
    checkId UNIQUEIDENTIFIER PRIMARY KEY NOT NULL,
    submission1Id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Submissions(submissionId) ON DELETE CASCADE,
    submission2Id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES Submissions(submissionId) ON DELETE NO ACTION,
	CHECK (submission1Id < submission2Id),
	UNIQUE (submission1Id, submission2Id),
    similarityScore FLOAT(53),
    checkedAt DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
);

-- Indexes
CREATE INDEX IX_Submissions_User ON Submissions(submitterId);
CREATE INDEX IX_Submissions_Problem ON Submissions(problemId);
CREATE INDEX IX_SubmissionResults_Submission ON SubmissionResults(submissionId);
CREATE INDEX IX_ContestParticipants_User ON ContestParticipants(participantId);
CREATE INDEX IX_ContestProblems_Problem ON ContestProblems(problemId);
CREATE INDEX IX_Submissions_Contest ON Submissions(contestId, finalVerdict);
CREATE INDEX IX_Problems_Difficulty ON Problems(difficulty);
CREATE INDEX IX_Submissions_Status ON Submissions(submissionStatus);
CREATE INDEX IX_Contests_Time ON Contests(startTime, endTime);
CREATE INDEX IX_Users_Role ON Users(roleId) WHERE isActive = 1;
CREATE INDEX IX_Submissions_CreatedAt ON Submissions(createAt DESC);
CREATE INDEX IX_UserNotifications_User ON UserNotifications(userId, isRead);
CREATE INDEX IX_Notifications_Type ON Notifications(notificationId, createdAt DESC);