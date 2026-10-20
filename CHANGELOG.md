# Changelog

All notable changes to the **PetTracker API** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- **GitHub Actions CI/CD Workflows** (`.github/workflows/`):
  - `.github/workflows/ci.yml`: Automated CI pipeline running ESLint, Prettier validation, unit test execution with coverage artifacts, and NestJS build verification on all PRs and pushes to `master`.
  - `.github/workflows/cd.yml`: Continuous Deployment workflow supporting automated Railway deployments (via CLI or webhook) and automated Docker multi-stage image publishing to GitHub Container Registry (`ghcr.io`).
- **Production Multi-Stage Dockerfile & .dockerignore**:
  - Added optimized Alpine-based multi-stage `Dockerfile` with non-root security runner and minimal production image footprint.
  - Added `.dockerignore` ignoring temporary build, test, and environment files.

### Changed
- Configured Jest module path mapping (`^src/(.*)$`) in `package.json` for seamless test resolution in CI/CD.
- Updated unit test specs (`user.service.spec.ts`, `pet.*.spec.ts`, `vaccine.*.spec.ts`, `weight.*.spec.ts`) with proper mock providers so tests pass deterministically in CI.

### Fixed
- Fixed ESLint type-safety errors in `RolesGuard`, `GlobalExceptionFilter`, and `IsNotFutureDate` validator.

---

## [0.5.0] - 2026-10-02 — Observability, Prometheus Metrics & Grafana Cloud

### Added
- **Custom Metrics Module (`MetricsModule`)** (`0a2c65d`):
  - Implemented `MetricsService` with `prom-client` default Node.js runtime metrics (`pettracker_` prefix), HTTP counters (`http_requests_total`), latency histograms (`http_request_duration_seconds`), and domain metrics (`pettracker_pets_created_total` counter and `pettracker_trackers_online` gauge).
  - Added global `MetricsInterceptor` to automatically measure HTTP request duration and count requests by `method`, normalized `route`, and `status`.
  - Added `MetricsController` (`GET /metrics`) returning Prometheus text exposition format.
- **Prometheus & Grafana Alloy Integration** (`e8cfe58`, `763a067`):
  - Integrated `@willsoto/nestjs-prometheus` and `prom-client` for application telemetry.
  - Added `config.alloy.example` template for scraping `/metrics` and pushing telemetry to **Grafana Cloud Hosted Prometheus** via `prometheus.remote_write`.
  - Added `MetricsTokenGuard` to protect the `/metrics` endpoint in production environments (`METRICS_TOKEN`).

### Changed
- **Metrics Authentication Guard** (`6f59505`):
  - Enhanced `MetricsTokenGuard` to accept token authentication via both `x-metrics-token` and `Authorization: Bearer <token>` headers.
- **Package Management & Tooling** (`d9d5aab`, `d9dbd9e`):
  - Migrated package manager workflow from `npm` to `pnpm`.
  - Updated `README.md` and `.gitignore` with observability documentation and Alloy configuration rules.

### Fixed
- Resolved minor import path and TypeScript build issues (`537dc41`, `bb218ca`).

---

## [0.4.0] - 2026-08-16 — Google OAuth 2.0 & Proactive Notifications Engine

### Added
- **Automated Vaccine Reminders Cron Job** (`3b1bc53`, `2416742`):
  - Created `NotificationsModule`, `NotificationsController`, `NotificationsService`, and `Notification` entity.
  - Integrated `@nestjs/schedule` with a daily background job at 8:00 AM (`CronExpression.EVERY_DAY_AT_8AM`) to scan upcoming and expired vaccines.
  - Automated idempotent in-app notifications for vaccines due in **7 days**, **1 day**, and **overdue**, automatically transitioning expired vaccines to `VaccineStatus.OVERDUE`.
  - Added endpoints for listing notifications (`GET /notifications`), unread badge counts (`GET /notifications/unread-count`), marking individual alerts as read (`PATCH /notifications/:id/read`), and bulk marking all as read (`PATCH /notifications/read-all`).
- **Google OAuth 2.0 Single-Use Code Exchange Flow** (`bda1559`, `df0ba33`, `5aafbdc`):
  - Added `GoogleStrategy` (`passport-google-oauth20`) and `GoogleAuthGuard` (`GET /auth/google`, `GET /auth/google/callback`).
  - Implemented secure single-use, 2-minute expiring authorization code exchange (`POST /auth/google/exchange`) with hashed code storage (`googleAuthCodeHash`, `googleAuthCodeExpiresAt`) so JWTs are never exposed in redirect URLs.
  - Added `.env.example` template with database, JWT, encryption, S3, and Google OAuth variables.

### Changed
- **Stateless Token Handling** (`df0ba33`):
  - Refactored `AuthController` and `AuthService` to return `accessToken` and `refreshToken` directly in JSON responses for Next.js `HttpOnly` cookie management instead of direct backend cookie mutations.
- **Weight & Vaccine Domain Refinements** (`f543f5c`, `4827ad0`, `7f20e38`):
  - Renamed `name` to `vaccineName` in `Vaccine` entity and `CreateVaccineDto`.
  - Enforced pet ownership validation across `VaccineService.findAllByPet` and `WeightService.create`.
  - Standardized date fields in DTOs and services using ISO date strings.

---

## [0.3.0] - 2026-07-23 — S3 Presigned URLs, Account Soft Delete & Domain Validation

### Added
- **AWS S3 Presigned URLs & Lifecycle Cleanup** (`fd32c44`, `1c5c78b`, `827a102`, `208b533`):
  - Integrated `@aws-sdk/s3-request-presigner` to generate temporary signed URLs for private pet images.
  - Added automatic S3 object deletion when a pet is removed or its photo is replaced.
- **User Account Soft Deletion & Profile Endpoint** (`5e916e8`, `aac502c`):
  - Implemented soft delete (`@DeleteDateColumn`) on the `User` entity (`DELETE /user/me`) and updated JWT validation to reject deactivated or soft-deleted accounts.
  - Added `GET /user/me` endpoint for retrieving the authenticated user's profile.
- **Custom Date & Entity Validations** (`d5288c3`, `174186c`, `bad96a4`):
  - Added custom `@IsNotFutureDate()` validator to prevent future `birthDate` values on pets.
  - Introduced `VaccineStatus` enum (`APPLIED`, `PENDING`, `OVERDUE`) on the `Vaccine` entity.
  - Added `measurementDay` field validation to `CreateWeightDto`.

### Changed
- **Entity Schema & Optional Uploads** (`70c1161`, `9cdaba9`, `77bf718`, `01c73e7`):
  - Made pet image file upload optional during pet creation (`CreatePetDto`).
  - Renamed `phoneNumber` to `phone` on `User` entity and added optional `notes` field on `Pet` entity.
  - Hardened application bootstrap with `helmet` HTTP security headers.

---

## [0.2.0] - 2026-06-29 — Security Hardening, Rate Limiting, RBAC & AWS S3 Uploads

### Added
- **AWS S3 Storage Integration** (`4dd4b5d`):
  - Created `S3Module` and `S3Service` (`@aws-sdk/client-s3`) for uploading pet photos with Multer file type (`png`, `jpeg`, `jpg`, `webp`) and size (`3MB`) validation.
- **Rate Limiting & CORS Protection** (`c855623`, `588b9c1`):
  - Integrated `@nestjs/throttler` for global rate limiting (150 req/min) and strict route throttling on authentication endpoints.
  - Configured strict CORS policy for allowed frontend origins (`localhost:3000` and `pet-tracker-web.vercel.app`).
- **Role-Based Access Control (RBAC) & Token Rotation** (`d0e0f95`, `39f7b90`):
  - Added `UserRole` enum (`USER`, `ADMIN`), `@Roles()` decorator, and `RolesGuard`.
  - Implemented JWT Refresh Token rotation (`POST /auth/refresh`) and logout handling.
- **Admin User Pagination & Weight Deletion** (`610b294`):
  - Added paginated user listing (`GET /user/all`) restricted to `ADMIN` users via `PaginationDto`.
  - Added endpoint to delete individual weight records (`DELETE /weight/:id`).

### Fixed
- Fixed `UserRole` import path in `@Roles()` decorator and refined authentication/weight error messages (`8701b43`, `1a15e1d`, `592f4b0`).
- Removed deprecated test and `.http` scratch files (`4076f1a`, `a3051ba`).

---

## [0.1.0] - 2026-05-11 — Initial Release & Core Domain Foundation

### Added
- **Project Initialization & Auth Core** (`a2a81c5`, `7f32f1c`):
  - Initialized NestJS 11 backend with TypeScript, PostgreSQL, and TypeORM.
  - Implemented `UserModule` and `AuthModule` with `bcryptjs` password hashing and JWT authentication (`@nestjs/jwt`, `passport-jwt`).
- **Pet, Vaccine & Weight Modules** (`ef3df99`, `0628d98`):
  - Implemented `PetModule` with full CRUD operations and owner isolation.
  - Added `VaccineModule` and `WeightModule` for tracking pet vaccinations and weight history (including last 10 weight entries for trend charts).
  - Added `CommonModule` providing `AES-256-CTR` encryption (`CryptoEncryptingService`) and `BcryptHashingService`.
- **API Documentation** (`d84a0e4`):
  - Integrated Swagger / OpenAPI 3.0 documentation (`@nestjs/swagger`) served at `/api`.
