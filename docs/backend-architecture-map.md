# CodeTrials Backend — Architecture Map

> [!NOTE]
> Chỉ map kiến trúc, **không review code**. Tất cả thông tin được thu thập trực tiếp từ source code.

## Tổng Quan

**CodeTrials** là nền tảng chấm bài lập trình trực tuyến (Online Judge) xây dựng trên **Spring Boot 3.5.9** + **Java 21**. Hệ thống hỗ trợ quản lý cuộc thi, bài tập, nộp bài tự động/thủ công, chống đạo văn (plagiarism detection), và thông báo thời gian thực.

| Thành phần | Công nghệ |
|---|---|
| Framework | Spring Boot 3.5.9 |
| Java | 21 |
| Database | SQL Server (default), PostgreSQL (optional) |
| Cache / Token Blacklist | Redis (Upstash) |
| Object Storage | Cloudflare R2 (qua AWS S3 SDK) |
| Code Judge | Judge0 (self-hosted, port 2358) |
| Plagiarism Detection | Microservice riêng (port 3000) |
| Auth | JWT (jjwt 0.11.5) + OAuth2 |
| Mapper | MapStruct 1.6.3 |
| WebSocket | STOMP over SockJS |
| Build | Maven, Docker multi-stage |

---

## Cấu Trúc Thư Mục

```
backend/
├── Dockerfile                          # Multi-stage build (JDK 21 → JRE 21 Alpine)
├── pom.xml                             # Maven dependencies
├── src/
│   ├── main/
│   │   ├── java/com/example/app/
│   │   │   ├── Application.java        # @SpringBootApplication entry point
│   │   │   │                            # Enables: JPA, Redis, Async, Scheduling
│   │   │   ├── config/                  # ── Infrastructure Configuration ──
│   │   │   │   ├── ApiConfig.java
│   │   │   │   ├── AsyncConfig.java                  # Thread pools: judgeExecutor, scorerExecutor
│   │   │   │   ├── JwtAuthenticationEntryPoint.java   # 401 handler
│   │   │   │   ├── PepperBCryptEncoder.java           # BCrypt + pepper
│   │   │   │   ├── RedisConfig.java
│   │   │   │   ├── S3Config.java                      # Cloudflare R2 client
│   │   │   │   ├── SecurityConfig.java                # Filter chain, CORS, RBAC
│   │   │   │   ├── TokenCleanupScheduler.java         # Scheduled token cleanup
│   │   │   │   ├── WebSocketAuthInterceptor.java      # JWT auth cho WebSocket
│   │   │   │   └── WebSocketConfig.java               # STOMP broker config
│   │   │   │
│   │   │   ├── controller/              # ── REST API Layer (14 controllers) ──
│   │   │   │   ├── AdminController.java
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── ContestController.java
│   │   │   │   ├── HealthCheckController.java
│   │   │   │   ├── JudgeCallbackController.java       # Judge0 webhook receiver
│   │   │   │   ├── LanguageController.java
│   │   │   │   ├── MaintenanceController.java
│   │   │   │   ├── NotificationController.java
│   │   │   │   ├── ProblemController.java
│   │   │   │   ├── StatisticsController.java
│   │   │   │   ├── SubmissionController.java
│   │   │   │   ├── SystemSettingsController.java
│   │   │   │   ├── TestcaseController.java
│   │   │   │   └── UserController.java
│   │   │   │
│   │   │   ├── service/                 # ── Business Logic Layer (21+ services) ──
│   │   │   │   ├── AdminService.java
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── ContestService.java               # ~15KB, largest service
│   │   │   │   ├── CustomUserDetails[Service].java    # Spring Security UserDetails
│   │   │   │   ├── EmailService.java                  # Gmail SMTP
│   │   │   │   ├── Judge0Client.java                  # HTTP client → Judge0 API
│   │   │   │   ├── JudgeRateLimiter.java              # Semaphore-based rate limiting
│   │   │   │   ├── JudgeTimeoutService.java           # Recovery cho stuck submissions
│   │   │   │   ├── LanguageService.java
│   │   │   │   ├── NotificationService.java
│   │   │   │   ├── OutputGeneratorService.java
│   │   │   │   ├── PlagiarismService.java             # ~13KB, plagiarism detection
│   │   │   │   ├── ProblemService.java
│   │   │   │   ├── S3StorageService.java              # Cloudflare R2 abstraction
│   │   │   │   ├── StatisticsService.java
│   │   │   │   ├── SubmissionService.java             # ~15KB, submission CRUD
│   │   │   │   ├── SystemSettingsService.java
│   │   │   │   ├── TestcaseService.java
│   │   │   │   ├── TokenBlacklistService.java         # Redis-based JWT blacklist
│   │   │   │   ├── UserServices.java
│   │   │   │   └── submission/          # ── Judging Pipeline (event-driven) ──
│   │   │   │       ├── SubmissionOrchestrator.java     # Entry point: event listener
│   │   │   │       ├── SubmissionDispatcher.java       # EXACT/HEURISTIC → Judge0
│   │   │   │       ├── ManualDispatcher.java           # MANUAL → NEED_REVIEW
│   │   │   │       ├── ResultProcessor.java            # Judge0 callback handler
│   │   │   │       ├── ScoringWorker.java              # HEURISTIC scorer runner
│   │   │   │       ├── Aggregator.java                 # Final score aggregation
│   │   │   │       └── event/
│   │   │   │           ├── SubmissionCreatedEvent.java
│   │   │   │           ├── JudgeResultReceivedEvent.java
│   │   │   │           ├── ScoringRequiredEvent.java
│   │   │   │           └── ManualScoredEvent.java
│   │   │   │
│   │   │   ├── entity/                  # ── JPA Entities (19 entities) ──
│   │   │   │   ├── Contest.java
│   │   │   │   ├── ContestParticipant.java + ContestParticipantId.java
│   │   │   │   ├── ContestProblem.java + ContestProblemId.java
│   │   │   │   ├── Language.java
│   │   │   │   ├── Notification.java
│   │   │   │   ├── Permission.java
│   │   │   │   ├── PlagiarismCheck.java
│   │   │   │   ├── Problem.java
│   │   │   │   ├── RefreshToken.java
│   │   │   │   ├── Roles.java
│   │   │   │   ├── Submission.java
│   │   │   │   ├── SubmissionResult.java
│   │   │   │   ├── SystemSettings.java
│   │   │   │   ├── Testcase.java
│   │   │   │   ├── UserNotification.java + UserNotificationId.java
│   │   │   │   ├── Users.java
│   │   │   │   └── enums/
│   │   │   │       ├── ContestState.java
│   │   │   │       ├── Difficulty.java
│   │   │   │       ├── EvaluationType.java            # EXACT | HEURISTIC | MANUAL
│   │   │   │       ├── PlagiarismVerdict.java
│   │   │   │       ├── SubmissionStatus.java          # COMPILING | RUNNING | DONE | ERROR | NEED_REVIEW
│   │   │   │       └── Verdict.java                   # ACCEPTED | FAILED | PARTIAL | TLE | MLE | CE | RE
│   │   │   │
│   │   │   ├── repository/             # ── Data Access Layer (15 repos) ──
│   │   │   │   ├── Contest[*]Repository.java          # (3 repos)
│   │   │   │   ├── LanguageRepository.java
│   │   │   │   ├── NotificationRepository.java
│   │   │   │   ├── PlagiarismCheckRepository.java
│   │   │   │   ├── ProblemRepository.java
│   │   │   │   ├── RefreshTokenRepository.java
│   │   │   │   ├── RoleRepository.java
│   │   │   │   ├── Submission[Result]Repository.java  # (2 repos, ~5KB cho Submission)
│   │   │   │   ├── SystemSettingsRepository.java
│   │   │   │   ├── TestcaseRepository.java
│   │   │   │   ├── UserNotificationRepository.java
│   │   │   │   └── UserRepository.java
│   │   │   │
│   │   │   ├── dto/                     # ── Data Transfer Objects ──
│   │   │   │   ├── ApiResponse.java                   # Generic wrapper {message, result}
│   │   │   │   ├── request/
│   │   │   │   │   ├── auth/            # LoginRequest, RegisterRequest
│   │   │   │   │   ├── contest/         # Create, Update, AddProblem, BulkAddParticipants
│   │   │   │   │   ├── notification/    # CreateNotification, SendEmail
│   │   │   │   │   ├── problem/         # Create, Update
│   │   │   │   │   ├── submission/      # SubmitCode, ManualGrade
│   │   │   │   │   ├── testcase/        # Create, Update
│   │   │   │   │   └── user/            # Create, AdminUpdate, ChangePassword, ProfileUpdate
│   │   │   │   ├── response/            # 20 response DTOs
│   │   │   │   └── judge0/              # Judge0Request, Judge0Response, Judge0CallbackPayload
│   │   │   │
│   │   │   ├── mapper/                  # ── MapStruct Mappers (5) ──
│   │   │   │   ├── ContestMapper.java
│   │   │   │   ├── ProblemMapper.java
│   │   │   │   ├── SubmissionMapper.java
│   │   │   │   ├── TestcaseMapper.java
│   │   │   │   └── UserMapper.java
│   │   │   │
│   │   │   ├── security/               # ── Security Filters & Utils ──
│   │   │   │   ├── JwtAuthenticationFilter.java       # JWT extraction & validation
│   │   │   │   ├── JwtUtil.java                       # Token generation & parsing
│   │   │   │   ├── MaintenanceFilter.java             # System maintenance mode
│   │   │   │   ├── RateLimitFilter.java               # Bucket4j rate limiting
│   │   │   │   └── SecurityHelper.java                # Current user context
│   │   │   │
│   │   │   ├── exception/              # ── Error Handling ──
│   │   │   │   ├── AppException.java
│   │   │   │   ├── ErrorCode.java                     # Centralized error codes (~3.5KB)
│   │   │   │   └── GlobalExceptionHandler.java        # @ControllerAdvice
│   │   │   │
│   │   │   ├── helpers/
│   │   │   │   └── PasswordGenerator.java
│   │   │   │
│   │   │   └── util/                   # ── Plagiarism Utilities ──
│   │   │       ├── AstSimilarityUtil.java
│   │   │       ├── CfgSimilarityUtil.java
│   │   │       ├── CodeNormalizer.java
│   │   │       └── WinnowingUtil.java
│   │   │
│   │   └── resources/
│   │       ├── application.properties
│   │       └── application.properties.example
│   │
│   └── test/java/                       # Test directory (structure exists)
```

---

## Sơ Đồ Luồng Dữ Liệu (Data Flow)

### 1. Luồng Tổng Thể — Request Lifecycle

```mermaid
graph TD
    Client["🌐 Client<br/>(Browser / Frontend)"]

    subgraph SecurityLayer["Security Filter Chain"]
        direction TB
        RateLimit["RateLimitFilter<br/>(Bucket4j)"]
        JwtFilter["JwtAuthenticationFilter<br/>(JWT Validation)"]
        MaintFilter["MaintenanceFilter<br/>(System Lock)"]
    end

    subgraph Controllers["REST Controllers"]
        AuthCtrl["AuthController<br/>/api/auth/**"]
        UserCtrl["UserController"]
        ProblemCtrl["ProblemController"]
        ContestCtrl["ContestController"]
        SubCtrl["SubmissionController"]
        TestCtrl["TestcaseController"]
        JudgeCallback["JudgeCallbackController<br/>/api/internal/judge/callback"]
        NotifCtrl["NotificationController"]
        AdminCtrl["AdminController"]
        StatsCtrl["StatisticsController"]
    end

    subgraph Services["Service Layer"]
        AuthSvc["AuthService"]
        UserSvc["UserServices"]
        ProblemSvc["ProblemService"]
        ContestSvc["ContestService"]
        SubSvc["SubmissionService"]
        TestSvc["TestcaseService"]
        NotifSvc["NotificationService"]
        PlagSvc["PlagiarismService"]
        StatsSvc["StatisticsService"]
    end

    subgraph DataAccess["Repository Layer (JPA)"]
        Repos["15 Spring Data<br/>JPA Repositories"]
    end

    subgraph ExternalSystems["External Systems"]
        DB[("SQL Server<br/>Database")]
        Redis[("Redis<br/>(Upstash)")]
        R2["☁️ Cloudflare R2<br/>(S3 SDK)"]
        Judge0["⚖️ Judge0<br/>Code Execution"]
        PlagWorker["🔍 Plagiarism<br/>Worker (port 3000)"]
        Gmail["📧 Gmail SMTP"]
    end

    Client --> RateLimit --> JwtFilter --> MaintFilter
    MaintFilter --> Controllers
    Controllers --> Services
    Services --> Repos --> DB
    Services --> Redis
    Services --> R2
    Services --> Judge0
    Services --> PlagWorker
    Services --> Gmail
    Judge0 -->|"Webhook Callback"| JudgeCallback
```

---

### 2. Luồng Chấm Bài — Submission Judging Pipeline (Event-Driven)

Đây là luồng phức tạp nhất của hệ thống, sử dụng **Spring Application Events** để tạo pipeline async.

```mermaid
sequenceDiagram
    participant Client as 🌐 Client
    participant SubCtrl as SubmissionController
    participant SubSvc as SubmissionService
    participant Spring as Spring EventBus
    participant Orch as SubmissionOrchestrator
    participant Disp as SubmissionDispatcher
    participant ManDisp as ManualDispatcher
    participant Judge0 as ⚖️ Judge0
    participant S3 as ☁️ Cloudflare R2
    participant Callback as JudgeCallbackController
    participant Proc as ResultProcessor
    participant Scorer as ScoringWorker
    participant Agg as Aggregator
    participant WS as WebSocket /topic

    Client->>SubCtrl: POST /submissions
    SubCtrl->>SubSvc: submit(request)
    SubSvc->>SubSvc: Validate, create Submission entity
    SubSvc-->>Spring: publish SubmissionCreatedEvent
    SubSvc-->>Client: 200 OK (submissionId)

    Note over Spring,Orch: @Async("judgeExecutor")

    Spring->>Orch: handleSubmissionCreated(event)

    alt EvaluationType == EXACT or HEURISTIC
        Orch->>Disp: dispatch(submission)
        Disp->>S3: Read testcase inputs/outputs
        Disp->>Judge0: submitBatch(requests)
        Judge0-->>Disp: tokens[]
        Disp->>Disp: Save SubmissionResults with tokens
        Disp->>Disp: Status → RUNNING
    else EvaluationType == MANUAL
        Orch->>ManDisp: dispatch(submission)
        ManDisp->>ManDisp: Status → NEED_REVIEW
    end

    Note over Judge0,Callback: Async callback per testcase

    Judge0->>Callback: POST /api/internal/judge/callback
    Callback->>Proc: processCallback(payload)
    Proc->>S3: Save user output
    Proc->>Proc: mapVerdict + enforceResourceLimits

    alt EvaluationType == HEURISTIC && Verdict == ACCEPTED
        Proc-->>Spring: publish ScoringRequiredEvent
        Spring->>Scorer: handleScoringRequired(event)
        Scorer->>S3: Read input, expected, user output
        Scorer->>Judge0: submitSync(scorerCode)
        Judge0-->>Scorer: scorer result (score: X)
        Scorer->>Scorer: Set verdict + score
        Scorer-->>Spring: publish JudgeResultReceivedEvent
    else All other verdicts
        Proc->>Proc: Set verdict + score directly
        Proc-->>Spring: publish JudgeResultReceivedEvent
    end

    Spring->>Agg: onJudgeResult(event)
    Agg->>Agg: Check all results received?

    alt All testcases judged
        Agg->>Agg: Calculate finalScore, finalVerdict
        Agg->>Agg: Status → DONE
    end
```

---

### 3. Luồng Authentication & Authorization

```mermaid
graph LR
    subgraph AuthFlow["Authentication Flow"]
        Login["POST /api/auth/login"] --> AuthSvc["AuthService"]
        Register["POST /api/auth/register"] --> AuthSvc
        AuthSvc --> PepperBCrypt["PepperBCryptEncoder<br/>(BCrypt + pepper)"]
        AuthSvc --> JwtUtil["JwtUtil<br/>(Generate JWT)"]
        AuthSvc --> RefreshToken["RefreshToken<br/>(DB stored)"]
        JwtUtil --> Redis["Redis<br/>(Token Blacklist)"]
    end

    subgraph FilterChain["Per-Request Auth"]
        Request["Incoming Request"]
        Request --> RateLimit["RateLimitFilter<br/>(Bucket4j)"]
        RateLimit --> JwtFilter["JwtAuthFilter<br/>(Extract & Validate)"]
        JwtFilter --> BlacklistCheck["TokenBlacklistService<br/>(Redis check)"]
        JwtFilter --> MaintFilter["MaintenanceFilter"]
        MaintFilter --> RBAC["@PreAuthorize<br/>Permission-based"]
    end
```

---

### 4. Luồng Dữ Liệu File Storage (Cloudflare R2)

```mermaid
graph TD
    subgraph Upload["Upload Flows"]
        TC_Upload["TestcaseService<br/>Upload input/output"] -->|"testcases/{id}/input.txt<br/>testcases/{id}/output.txt"| R2["☁️ Cloudflare R2"]
        Avatar["UserServices<br/>Upload avatar"] -->|"avatars/{userId}.*"| R2
        Output["ResultProcessor<br/>Save user stdout"] -->|"submissions/{id}/results/{tcId}/output.txt"| R2
    end

    subgraph Download["Download Flows"]
        R2 -->|"Read inputs"| Disp["SubmissionDispatcher"]
        R2 -->|"Read for scoring"| Scorer["ScoringWorker"]
        R2 -->|"Read for display"| SubSvc["SubmissionService"]
    end
```

---

### 5. Luồng Real-Time (WebSocket)

```mermaid
graph LR
    Client["🌐 Client"] -->|"STOMP /ws (SockJS)"| WS["WebSocketConfig"]
    WS --> AuthIntercept["WebSocketAuthInterceptor<br/>(JWT validation)"]
    AuthIntercept --> Broker["SimpleBroker"]

    Broker -->|"/topic/..."| Topic["Topic Messages"]
    Broker -->|"/queue/..."| Queue["User-specific Queue"]
    Broker -->|"/user/..."| UserDest["User Destination"]

    NotifSvc["NotificationService"] -->|"send"| Broker
```

---

### 6. Entity Relationship Map

```mermaid
erDiagram
    Users ||--o{ Submission : submits
    Users ||--o{ ContestParticipant : participates
    Users ||--o{ UserNotification : receives
    Users ||--o{ RefreshToken : has

    Problem ||--o{ Submission : "solved via"
    Problem ||--o{ Testcase : has
    Problem ||--o{ ContestProblem : "used in"
    Problem ||--o{ PlagiarismCheck : checked

    Contest ||--o{ ContestProblem : contains
    Contest ||--o{ ContestParticipant : "has members"

    Submission ||--o{ SubmissionResult : "per testcase"
    Submission ||--o{ PlagiarismCheck : "checked for"

    Testcase ||--o{ SubmissionResult : "judged against"

    Notification ||--o{ UserNotification : "sent to"

    Roles ||--o{ Permission : grants
    Users }o--|| Roles : "has role"

    Language ||--o{ Submission : "written in"
```

---

## Bảng Tóm Tắt Các Tích Hợp Bên Ngoài

| Hệ thống | Vai trò | Giao tiếp | File liên quan |
|---|---|---|---|
| **Judge0** (localhost:2358) | Thực thi & chấm code | HTTP REST + Webhook callback | [Judge0Client](file:///d:/Code/CodeTest/backend/src/main/java/com/example/app/service/Judge0Client.java), [JudgeCallbackController](file:///d:/Code/CodeTest/backend/src/main/java/com/example/app/controller/JudgeCallbackController.java) |
| **Cloudflare R2** | Lưu trữ testcase I/O, avatar, output | AWS S3 SDK | [S3StorageService](file:///d:/Code/CodeTest/backend/src/main/java/com/example/app/service/S3StorageService.java), [S3Config](file:///d:/Code/CodeTest/backend/src/main/java/com/example/app/config/S3Config.java) |
| **Redis** (Upstash) | Token blacklist, caching | Spring Data Redis + SSL | [RedisConfig](file:///d:/Code/CodeTest/backend/src/main/java/com/example/app/config/RedisConfig.java), [TokenBlacklistService](file:///d:/Code/CodeTest/backend/src/main/java/com/example/app/service/TokenBlacklistService.java) |
| **SQL Server** | Primary database | JPA/Hibernate | 15 Repository files |
| **Plagiarism Worker** (localhost:3000) | Phân tích đạo văn code | HTTP REST | [PlagiarismService](file:///d:/Code/CodeTest/backend/src/main/java/com/example/app/service/PlagiarismService.java) |
| **Gmail SMTP** | Gửi email thông báo | JavaMail | [EmailService](file:///d:/Code/CodeTest/backend/src/main/java/com/example/app/service/EmailService.java) |

---

## Đặc Điểm Kiến Trúc Nổi Bật

1. **Event-Driven Judging Pipeline**: Submission → Orchestrator → Dispatcher → Judge0 → Callback → ResultProcessor → Scorer (nếu HEURISTIC) → Aggregator. Toàn bộ sử dụng Spring `ApplicationEvent` + `@Async`.

2. **3 Evaluation Types**: `EXACT` (so sánh output), `HEURISTIC` (custom scorer chạy trên Judge0), `MANUAL` (giáo viên chấm tay).

3. **Permission-based RBAC**: Không dùng role-based đơn giản mà dùng permission granular (e.g., `PROBLEM_READ`, `TESTCASE_CREATE`, `SUBMISSION_REJUDGE`).

4. **Retry & Recovery**: `JudgeTimeoutService` tự động phục hồi submission bị stuck. Judge0 client có retry config (max 3 attempts, exponential backoff).

5. **Rate Limiting ở 2 tầng**: HTTP level (Bucket4j filter) + Judge0 level (Semaphore-based `JudgeRateLimiter`).

6. **Security hardening**: BCrypt + pepper, JWT blacklist qua Redis, maintenance mode filter, HSTS, XSS protection headers, CORS whitelist.
