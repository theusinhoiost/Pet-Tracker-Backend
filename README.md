# 🐾 PetTracker API

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0803?style=for-the-badge&logo=typeorm&logoColor=white)
![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

**A modern, production-ready, enterprise-grade RESTful API for comprehensive pet health tracking, vaccination scheduling, weight monitoring, automated proactive notifications, telemetry observability with Prometheus & Grafana Cloud, and multi-provider authentication.**

[Live Frontend](https://pet-tracker-web.vercel.app) • [Interactive API Docs (Swagger)](#-interactive-api-documentation) • [Features](#-features) • [Observability & Monitoring](#-observability--telemetry-grafana-cloud--alloy) • [Getting Started](#-getting-started) • [Database Model](#-database-model-erd) • [Changelog](./CHANGELOG.md)

</div>

---

## 📖 Overview

**PetTracker API** is the core backend engine powering the PetTracker ecosystem. Engineered with **NestJS 11**, **TypeScript**, **PostgreSQL**, and **AWS S3**, it delivers a scalable architecture designed to handle real-world SaaS requirements:

* **Enterprise Authentication**: Multi-provider login (Email/Password + Google OAuth 2.0 with single-use exchange codes), dual-token JWT rotation (short-lived access tokens and hashed refresh tokens), and Role-Based Access Control (RBAC).
* **Defensive Security**: Protected by **Helmet**, strict CORS, AES-256-CTR token encryption, and granular Rate Limiting via `@nestjs/throttler`.
* **Proactive Healthcare**: Complete management for pets, vaccination schedules, historical weight analytics, and an **automated daily background cron job** (`@nestjs/schedule`) delivering in-app vaccine expiration reminders.
* **Cloud Object Storage**: AWS S3 integration with strict validation (mimetype, size limit), pre-signed expiring download URLs (`@aws-sdk/s3-request-presigner`), and automated asset cleanup on deletion.
* **Observability & Grafana Cloud Telemetry**: Native **Prometheus metrics** (`prom-client`, `@willsoto/nestjs-prometheus`) with custom HTTP interceptors and domain gauges/counters (`MetricsModule`), integrated with **Grafana Alloy** collector for forwarding metrics to **Grafana Cloud Hosted Prometheus**, secured in production via `MetricsTokenGuard`.
* **Containerized Infrastructure**: Streamlined developer experience with **Docker Compose** for local database management.

---

## ⚡ Features

### 🔐 Multi-Provider Authentication & Authorization
* **Credentials Auth**: Email & password authentication with secure password hashing (`bcryptjs`).
* **Google OAuth 2.0 Integration**: Single-use, short-lived authorization code exchange flow (expires in 2 minutes, stored hashed)—tokens are never leaked directly in URL queries.
* **Token Lifecycle**: Short-lived JWT Access Tokens combined with rotating Refresh Tokens hashed in PostgreSQL.
* **Role-Based Access Control (RBAC)**: Custom `@Roles()` decorator and `RolesGuard` supporting `USER` and `ADMIN` tiers.
* **Security Controls**: Force logout support (`forceLogout`) and account soft deletion (`@DeleteDateColumn`).

### 🛡️ Application Hardening & Security
* **Helmet Middleware**: Comprehensive HTTP headers, including Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), and referrer policies.
* **Rate Limiting (Throttler)**: Global protection (150 req/min) paired with strict endpoint-specific limits (`/auth/login` at 5 req/min, `/auth/google/exchange` at 10 req/min, `/auth/refresh` at 20 req/30s).
* **Payload Validation**: Strict `ValidationPipe` with auto-transformation, whitelisting, rejection of unallowed properties, and custom validators (`IsNotFutureDate`).
* **Reversible Encryption**: Built-in `AES-256-CTR` service using `scrypt` key derivation and randomized IVs for sensitive credentials.

### 📊 Observability & Prometheus Metrics
* **Prometheus Telemetry Endpoint (`/metrics`)**: Standardized exposition format ready for Prometheus scrapers and Grafana dashboards.
* **Default Runtime Metrics**: Tracks Node.js CPU utilization, event loop latency, memory consumption, active handles, and garbage collection (prefixed with `pettracker_`).
* **Custom HTTP & Domain Metrics (`MetricsService` & `MetricsInterceptor`)**:
  * `http_requests_total`: Counter tracking inbound traffic labeled by HTTP `method`, normalized `route`, and response `status`.
  * `http_request_duration_seconds`: Histogram measuring execution duration and latency percentiles across buckets (`0.05s` to `5s`).
  * `pettracker_pets_created_total`: Counter tracking total pets registered on the platform.
  * `pettracker_trackers_online`: Gauge monitoring active trackers online.
* **Token-Guarded Security (`MetricsTokenGuard`)**:
  * In production (`NODE_ENV=production`), requires either the `x-metrics-token: <token>` header or `Authorization: Bearer <token>` matching the environment `METRICS_TOKEN`.
  * Open in development/staging environments for easy testing and local scraping.
* **Grafana Alloy Integration**: Pre-configured configuration template ([`config.alloy.example`](./config.alloy.example)) to scrape the API and stream telemetry directly into **Grafana Cloud**.

### 🐾 Pet Lifecycle Management
* Complete CRUD for pets with species classification (`dog`, `cat`, `bird`, `other`) and optional medical/behavioral `notes`.
* Strict tenant isolation: owners can only access, modify, or delete their own pets.
* Image upload with Multer, pre-filtered for allowed image types (`PNG`, `JPEG`, `JPG`, `WebP`) and max 3MB file size.

### 💉 Healthcare & Vaccine Schedule
* Track applied vaccines and upcoming booster doses (`vaccineName`, `applicationDate`, `nextDueDate`).
* Status tracking: `APPLIED`, `PENDING`, and `OVERDUE`.
* Cascade cleanup and complete ownership verification per pet.

### ⚖️ Weight Tracking & Trend Analytics
* Historical weight logging per pet with timestamped records (`value`, `measurementDay`).
* Specialized analytic endpoint (`GET /weight/:petId/last`) returning recent metrics (last 10 records) optimized for frontend progress charts.

### ⏰ Automated Background Engine & Notifications
* **Daily Cron Job** at 8:00 AM (`@Cron(CronExpression.EVERY_DAY_AT_8AM)`):
  * Scans all pet vaccines with scheduled `nextDueDate`.
  * Triggers idempotent proactive notifications at **7 days before**, **1 day before**, and **on overdue status**.
  * Automatically marks vaccine status as `OVERDUE` when expired.
* In-app notification management: unread count badges, single read, and bulk read-all operations.

### ☁️ Cloud Storage (AWS S3 & Compatible)
* Direct upload to private S3 buckets with sanitized, unique slug-based keys.
* Generates temporary **Pre-signed URLs** on retrieval, keeping storage buckets secure and private.
* Automatic file deletion on AWS S3 upon pet deletion or image replacement.
* S3-compatible: compatible out-of-the-box with **AWS S3**, **Cloudflare R2**, **MinIO**, **Supabase Storage**, and **LocalStack**.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    Client["Client / Frontend\n(Next.js / Web / Mobile)"]

    subgraph SecurityLayer ["Security & Ingress Layer"]
        Helmet["Helmet (CSP, HSTS)"]
        Cors["CORS Configuration"]
        Throttler["Throttler Guard (Rate Limiting)"]
        MetricsGuard["MetricsTokenGuard\n(x-metrics-token / Bearer)"]
        MetricsInt["MetricsInterceptor\n(Latency & Request Counters)"]
        Validation["ValidationPipe (Whitelist & DTOs)"]
    end

    subgraph AuthLayer ["Guards & Authentication"]
        JwtGuard["JwtAuthGuard (Access Token)"]
        GoogleGuard["GoogleAuthGuard (OAuth 2.0)"]
        RolesGuard["RolesGuard (RBAC: USER | ADMIN)"]
    end

    subgraph CoreApp ["NestJS Modular Controllers & Services"]
        AuthMod["AuthModule\n(Tokens, Exchange, Rotation)"]
        UserMod["UserModule\n(Profile, Passwords, Admin)"]
        PetMod["PetModule\n(CRUD, Ownership, Images)"]
        VaccineMod["VaccineModule\n(Schedule & Doses)"]
        WeightMod["WeightModule\n(Timeline & Trends)"]
        NotificationMod["NotificationsModule\n(In-App Alerts)"]
        MetricsMod["Prometheus & MetricsModule\n(Counters, Gauges & Histograms)"]
    end

    subgraph BackgroundWorker ["Automated Scheduler"]
        CronJob["Cron Engine (Daily @ 8:00 AM)\nVaccine Due Date & Overdue Scanner"]
    end

    subgraph ObservabilityPipeline ["Monitoring & Telemetry Pipeline"]
        Alloy["Grafana Alloy Collector\n(config.alloy)"]
        GrafanaCloud["Grafana Cloud\n(Hosted Prometheus & Dashboards)"]
    end

    subgraph Infrastructure ["Persistence & Cloud Storage"]
        Postgres[(PostgreSQL 15 Database\nTypeORM Entities)]
        S3["AWS S3 / S3-Compatible\n(Private Bucket + Presigned URLs)"]
    end

    Client --> Helmet
    Helmet --> Cors --> MetricsInt --> Throttler --> Validation
    Validation --> AuthLayer

    Alloy -->|Scrapes /metrics| MetricsGuard --> MetricsMod
    Alloy -->|remote_write push| GrafanaCloud

    AuthLayer --> CoreApp
    CronJob -->|Scans & Notifies| NotificationMod

    AuthMod --> Postgres
    UserMod --> Postgres
    PetMod --> Postgres
    VaccineMod --> Postgres
    WeightMod --> Postgres
    NotificationMod --> Postgres

    PetMod -->|Uploads / Deletes / Presigns| S3
```

---

## 📂 Project Structure

```txt
.
├── .github/
│   └── workflows/             # Automated CI and CD pipelines (GitHub Actions)
├── CHANGELOG.md               # Project release history and version changelog
├── config.alloy.example       # Grafana Alloy telemetry collector template (Grafana Cloud)
├── docker-compose.yml         # Containerized PostgreSQL 15 setup
├── Dockerfile                 # Multi-stage production container image
├── package.json               # Scripts & dependencies
├── pnpm-lock.yaml             # Pinned dependency tree
├── pnpm-workspace.yaml        # Workspace dependency & build configuration
├── rest-client/
│   └── request.example.http   # Ready-to-use HTTP requests for VS Code REST Client
├── src/
│   ├── app.module.ts          # Root module (TypeORM, Throttler, Schedule, Config)
│   ├── main.ts                # Bootstrap (Helmet, CORS, Metrics Guard/Interceptor, Swagger)
│   │
│   ├── auth/                  # Authentication & Authorization
│   │   ├── decorators/        # @Roles() custom decorator
│   │   ├── dto/               # LoginDto
│   │   ├── enum/              # UserRole enum (USER, ADMIN)
│   │   ├── guards/            # JwtAuthGuard, GoogleAuthGuard, RolesGuard
│   │   ├── types/             # AuthenticatedRequest, JwtPayloads
│   │   ├── google.strategy.ts # Passport Google OAuth 2.0 strategy
│   │   ├── jwt.strategy.ts    # Passport JWT Bearer strategy
│   │   ├── auth.controller.ts # Auth endpoints (/auth/login, /auth/google, etc.)
│   │   └── auth.service.ts    # OAuth code exchange, Token hashing & rotation
│   │
│   ├── user/                  # User & Account Management
│   │   ├── dto/               # CreateUser, UpdateUser, UpdatePassword, Pagination DTOs
│   │   ├── entities/          # User entity (soft deletes, roles, Google OAuth fields)
│   │   ├── user.controller.ts # User endpoints (/user, /user/me, /user/all)
│   │   └── user.service.ts    # Account lifecycle & security
│   │
│   ├── pet/                   # Pet Domain Core
│   │   ├── dto/               # CreatePet, UpdatePet DTOs
│   │   ├── entities/          # Pet entity
│   │   ├── types/             # PetSpecies & VaccineStatus enums
│   │   ├── pet.controller.ts  # Pet endpoints (/pet) with Multer file upload
│   │   ├── pet.service.ts     # Pet business rules & presigned image mapping
│   │   │
│   │   ├── vaccine/           # Vaccination Sub-Module
│   │   │   ├── dto/           # CreateVaccineDto
│   │   │   ├── entities/      # Vaccine entity
│   │   │   ├── vaccine.controller.ts
│   │   │   └── vaccine.service.ts
│   │   │
│   │   └── weight/            # Weight Tracking Sub-Module
│   │       ├── dto/           # CreateWeightDto
│   │       ├── entities/      # Weight entity
│   │       ├── weight.controller.ts
│   │       └── weight.service.ts
│   │
│   ├── notifications/         # Automated Notifications & Cron Engine
│   │   ├── entities/          # Notification entity & NotificationType enum
│   │   ├── notifications.controller.ts
│   │   └── notifications.service.ts # Daily 8:00 AM Cron scanner for vaccine alerts
│   │
│   └── common/                # Shared Cross-Cutting Concerns
│       ├── encrypting/        # AES-256-CTR crypto service with scrypt
│       ├── filters/           # Global exception filters
│       ├── hashing/           # Password hashing abstraction (bcryptjs)
│       ├── metrics/           # Prometheus controller, service, interceptor, and token guard
│       ├── s3/                # AWS S3 client & presigned URL generator
│       ├── utils/             # Slug generator & random suffix utilities
│       └── validators/        # Custom class-validators (IsNotFutureDate)
```

---

## 🗄️ Database Model (ERD)

```mermaid
erDiagram
    USER ||--o{ PET : "owns"
    USER ||--o{ NOTIFICATION : "receives"
    PET ||--o{ VACCINE : "has"
    PET ||--o{ WEIGHT : "tracks"
    PET ||--o{ NOTIFICATION : "triggers"

    USER {
        uuid id PK
        string name
        string email UK
        string password "Nullable (OAuth)"
        string phone UK "Nullable"
        string googleId UK "Nullable"
        string googleAuthCodeHash "Nullable"
        timestamp googleAuthCodeExpiresAt "Nullable"
        string avatar "Nullable"
        enum role "USER | ADMIN"
        boolean forceLogout
        boolean isActive
        string hashedRefreshToken "Nullable"
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt "Soft Delete"
    }

    PET {
        uuid id PK
        string name
        date birthDate
        string race
        enum species "dog | cat | bird | other"
        string imageKey "S3 Object Key (Nullable)"
        text notes "Nullable"
        uuid ownerId FK
        timestamp createdAt
        timestamp updatedAt
    }

    VACCINE {
        uuid id PK
        string vaccineName
        date applicationDate
        date nextDueDate "Nullable"
        enum status "APPLIED | PENDING | OVERDUE"
        uuid petId FK
        timestamp createdAt
    }

    WEIGHT {
        uuid id PK
        float value
        date measurementDay
        uuid petId FK
        timestamp createdAt
    }

    NOTIFICATION {
        uuid id PK
        uuid userId FK
        uuid petId FK "Nullable"
        uuid referenceId "Vaccine ID (Nullable)"
        string type "vaccine_reminder"
        string title
        text message
        boolean read
        timestamp createdAt
        timestamp updatedAt
    }
```

---

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Framework & Runtime** | [NestJS 11](https://nestjs.com/), [Node.js](https://nodejs.org/) (>= 20), [Express](https://expressjs.com/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (v5.7) |
| **Database & ORM** | [PostgreSQL 15](https://www.postgresql.org/), [TypeORM](https://typeorm.io/) |
| **Authentication & Auth** | [Passport.js](http://www.passportjs.org/), [JWT](https://jwt.io/), [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2), [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| **Security & Hardening** | [Helmet](https://helmetjs.github.io/), [@nestjs/throttler](https://github.com/nestjs/throttler), `crypto` (AES-256-CTR) |
| **Observability & Telemetry** | [Prometheus](https://prometheus.io/), [Grafana Cloud](https://grafana.com/products/cloud/), [Grafana Alloy](https://grafana.com/docs/alloy/latest/), [@willsoto/nestjs-prometheus](https://github.com/willsoto/nestjs-prometheus), [prom-client](https://github.com/siimon/prom-client) |
| **Cloud Object Storage** | [AWS SDK v3 S3](https://aws.amazon.com/s3/), [@aws-sdk/s3-request-presigner](https://www.npmjs.com/package/@aws-sdk/s3-request-presigner) |
| **Validation & Upload** | [class-validator](https://github.com/typestack/class-validator), [class-transformer](https://github.com/typestack/class-transformer), [Multer](https://github.com/expressjs/multer) |
| **Background Processing** | [@nestjs/schedule](https://docs.nestjs.com/techniques/task-scheduling) (Cron Jobs) |
| **API Documentation** | [Swagger / OpenAPI 3.0](https://swagger.io/) via `@nestjs/swagger` |
| **Containerization** | [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/) |
| **Package Manager** | [pnpm](https://pnpm.io/) |
| **Testing & Quality** | [Jest](https://jestjs.io/), [Supertest](https://github.com/ladjs/supertest), [ESLint v9](https://eslint.org/), [Prettier](https://prettier.io/) |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root based on [`.env.example`](./.env.example):

```bash
cp .env.example .env
```

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection URL | `postgresql://pettracker_user:PtR4nd0m_9x2k8Lm_qW7v@localhost:5432/pettracker_db` |
| `DB_AUTO_LOAD_ENTITIES` | **Yes** | Automatically load entities into TypeORM | `"1"` |
| `DB_SYNCHRONIZE` | **Yes** | Synchronize DB schema (disable in production!) | `"1"` (dev) / `"0"` (prod) |
| `JWT_ACCESS_SECRET` | **Yes** | Secret key for signing Access Tokens | `super_secret_access_key` |
| `JWT_REFRESH_SECRET` | **Yes** | Secret key for signing Refresh Tokens | `super_secret_refresh_key` |
| `JWT_EXPIRATION` | **Yes** | Expiration duration for Access Tokens | `15m` |
| `JWT_REFRESH_EXPIRATION` | No | Expiration duration for Refresh Tokens | `7d` |
| `ENCRYPT_PASSWORD` | **Yes** | Master key for AES-256-CTR reversible encryption | `my_super_strong_encrypt_secret_key` |
| `IV_LENGTH` | **Yes** | Initialization Vector byte length (AES-CTR) | `16` |
| `NODE_ENV` | No | Application environment (`development` / `production`) | `development` |
| `PORT` | No | HTTP server port (defaults to `3001`) | `3001` |
| `METRICS_TOKEN` | Optional | Secret token for Prometheus `/metrics` scraping in production (`x-metrics-token` or `Bearer`) | `my_telemetry_secure_token` |
| `FRONTEND_URL` | No | Frontend URL for OAuth redirects | `http://localhost:3000` |
| `S3_AWS_ACCESS_KEY` | **Yes** | AWS S3 / Cloudflare R2 Access Key ID | `AKIAIOSFODNN7EXAMPLE` |
| `S3_AWS_SECRET_KEY` | **Yes** | AWS S3 / Cloudflare R2 Secret Access Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `S3_AWS_BUCKET_NAME` | **Yes** | Name of the cloud storage bucket | `pettracker-storage` |
| `S3_AWS_REGION` | **Yes** | AWS Region for the bucket | `us-east-1` |
| `S3_AWS_ENDPOINT_URL` | No | Custom S3 endpoint (for MinIO, R2, or LocalStack) | `https://<account>.r2.cloudflarestorage.com` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 Client ID | `your-id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth 2.0 Client Secret | `GOCSPX-your-secret` |
| `GOOGLE_CALLBACK_URL` | Optional | Registered Google OAuth Redirect Callback URI | `http://localhost:3001/auth/google/callback` |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have installed:
* [Node.js](https://nodejs.org/) (>= 20.x)
* [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
* [Docker & Docker Compose](https://www.docker.com/)

### 1. Clone the repository

```bash
git clone https://github.com/theusinhoiost/PetTracker-backend.git
cd PetTracker-backend
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Spin up PostgreSQL with Docker Compose

Start the PostgreSQL 15 database container in the background:

```bash
docker compose up -d
```

> **Note**: This spins up the container `pettracker-db` on port `5432` with a persistent volume (`pgdata`), matching the default connection URL:  
> `DATABASE_URL=postgresql://pettracker_user:PtR4nd0m_9x2k8Lm_qW7v@localhost:5432/pettracker_db`

### 4. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 5. Run the application

```bash
# Development (with Hot Reload)
pnpm run start:dev

# Debug mode
pnpm run start:debug

# Production build
pnpm run build
pnpm run start:prod
```

Once started, the API will be available at:
* **API Base URL**: `http://localhost:3001`
* **Swagger Documentation**: `http://localhost:3001/api`
* **Prometheus Metrics**: `http://localhost:3001/metrics`

---

## 📈 Observability & Telemetry (Grafana Cloud + Alloy)

PetTracker includes a complete observability pipeline to stream live telemetry into **Grafana Cloud**:

1. **API Exposes Metrics**: The NestJS application exposes Prometheus metrics at `GET /metrics`. In production, this route is protected by `MetricsTokenGuard` and accepts either the `x-metrics-token` header or an `Authorization: Bearer <token>` header matching your `METRICS_TOKEN`.
2. **Grafana Alloy Scrapes & Pushes**: Configure [Grafana Alloy](https://grafana.com/docs/alloy/latest/) using the provided template ([`config.alloy.example`](./config.alloy.example)):

```bash
# Copy template configuration
cp config.alloy.example config.alloy
```

Edit `config.alloy` with your credentials:
```hcl
prometheus.remote_write "metrics_hosted_prometheus" {
  endpoint {
    url = "https://prometheus-prod-40-prod-sa-east-1.grafana.net/api/prom/push"
    basic_auth {
      username = "YOUR_USERNAME"
      password = "YOUR_GRAFANA_CLOUD_TOKEN"
    }
  }
}

prometheus.scrape "pettracker" {
  targets = [{
    __address__ = "your-app.up.railway.app:443",
    __scheme__ = "https",
    __metrics_path__ = "/metrics",
  }]
  extra_headers = {
    "x-metrics-token" = "YOUR_METRICS_TOKEN"
  }
  forward_to = [prometheus.remote_write.metrics_hosted_prometheus.receiver]
}
```

3. **Run Grafana Alloy**:
```bash
# Running directly
alloy run config.alloy

# Or with Docker
docker run -v $(pwd)/config.alloy:/etc/alloy/config.alloy \
  -p 12345:12345 \
  grafana/alloy:latest run /etc/alloy/config.alloy
```

---

## 📑 Interactive API Documentation

When running in development mode (`NODE_ENV !== 'production'`), interactive OpenAPI documentation is generated and served at:

👉 **`http://localhost:3001/api`**

You can also use the ready-to-use HTTP request file located at [`rest-client/request.example.http`](./rest-client/request.example.http) using the VS Code REST Client or Thunder Client extension.

---

## 🛣️ API Endpoints Reference

### 🔐 Authentication (`/auth`)

| Method | Endpoint | Description | Rate Limit | Auth |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/auth/login` | Authenticate with email and password | 5 req / min | Public |
| `GET` | `/auth/google` | Trigger Google OAuth 2.0 flow | - | Public |
| `GET` | `/auth/google/callback` | Google OAuth callback (issues 1-time code) | - | Public |
| `POST` | `/auth/google/exchange` | Exchange Google code for JWT access & refresh tokens | 10 req / min | Public |
| `POST` | `/auth/refresh` | Rotate and issue new access & refresh tokens | 20 req / 30s | Public |
| `GET` | `/auth/me` | Fetch authenticated user context | - | Bearer JWT |

### 👤 User Management (`/user`)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/user` | Register a new user account | Public |
| `GET` | `/user/me` | Retrieve profile of the current logged-in user | Bearer JWT |
| `PATCH` | `/user/me` | Update current user profile (`name`, `avatar`, `phone`) | Bearer JWT |
| `PATCH` | `/user/me/password` | Change user password (`currentPassword` & `newPassword`) | Bearer JWT |
| `DELETE` | `/user/me` | Soft delete the authenticated user account | Bearer JWT |
| `GET` | `/user/all` | List all registered users (paginated via `page` & `limit`) | Admin Only |

### 🐾 Pets (`/pet`)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/pet` | Register a new pet (supports `multipart/form-data` image) | Bearer JWT |
| `GET` | `/pet` | List all pets owned by the authenticated user | Bearer JWT |
| `GET` | `/pet/:id` | Get details and presigned photo URL of a specific pet | Bearer JWT |
| `PATCH` | `/pet/:id` | Update pet information | Bearer JWT |
| `DELETE` | `/pet/:id` | Delete a pet and automatically remove its image from S3 | Bearer JWT |

> **Multipart Upload for Pet Creation (`POST /pet`)**:  
> Acceptable file key: `pet-img` (`png`, `jpeg`, `jpg`, `webp`, max 3MB).  
> Fields: `name`, `race`, `species` (`dog` \| `cat` \| `bird` \| `other`), `birthDate` (`YYYY-MM-DD`, cannot be a future date), `notes` (optional).

### 💉 Vaccines (`/vaccines`)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/vaccines` | Record a vaccine (`vaccineName`, `applicationDate`, `nextDueDate`, `petId`) | Bearer JWT |
| `GET` | `/vaccines/:petId` | List all vaccines registered for a specific pet | Bearer JWT |
| `DELETE` | `/vaccines/:id` | Delete a vaccine record | Bearer JWT |

### ⚖️ Weight Records (`/weight`)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/weight` | Add a weight entry for a pet (`value`, `measurementDay`, `petId`) | Bearer JWT |
| `GET` | `/weight` | List all weight entries belonging to the user's pets | Bearer JWT |
| `GET` | `/weight/:petId` | Retrieve full weight history for a specific pet | Bearer JWT |
| `GET` | `/weight/:petId/last` | Get the last 10 weight records (tailored for trend charts) | Bearer JWT |
| `DELETE` | `/weight/:id` | Remove a weight log entry | Bearer JWT |

### 🔔 Notifications (`/notifications`)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/notifications` | List all in-app notifications for the authenticated user | Bearer JWT |
| `GET` | `/notifications/unread-count` | Get total count of unread notifications | Bearer JWT |
| `PATCH` | `/notifications/:id/read` | Mark a specific notification as read | Bearer JWT |
| `PATCH` | `/notifications/read-all` | Mark all notifications as read in bulk | Bearer JWT |

### 📊 Observability & Telemetry (`/metrics`)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/metrics` | Prometheus metrics (CPU, RAM, HTTP request count, latencies, domain gauges) | Open in dev; `x-metrics-token` or `Bearer` in prod |

---

## 🧪 Testing & Code Quality

The project includes unit tests for services and controllers built with **Jest**:

```bash
# Run all unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Generate test coverage report
pnpm run test:cov

# Code style linting and formatting
pnpm run lint
pnpm run format
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

The repository includes automated CI/CD workflows configured under [`.github/workflows/`](./.github/workflows/):

1. **Continuous Integration ([`ci.yml`](./.github/workflows/ci.yml))**:
   - Triggers on every `push` and `pull_request` targeting `master` or `main`.
   - Runs ESLint validation and Prettier format verification.
   - Executes Jest unit tests and generates coverage reports (saved as workflow artifacts).
   - Validates the production TypeScript build (`dist/main.js`).

2. **Continuous Deployment ([`cd.yml`](./.github/workflows/cd.yml))**:
   - Triggers on `push` to `master` and supports manual dispatch (`workflow_dispatch`).
   - Re-validates tests and compilation before deploying.
   - **Railway Deployment**: Triggers deployment via Railway Webhook (`RAILWAY_DEPLOY_WEBHOOK`) or Railway CLI (`RAILWAY_TOKEN`).
   - **Docker & Container Registry**: Automatically builds a production multi-stage image (`Dockerfile`) and pushes to **GitHub Container Registry (GHCR)** (`ghcr.io/<owner>/<repo>:latest`).

#### Recommended GitHub Secrets for CD:
* `RAILWAY_TOKEN` or `RAILWAY_DEPLOY_WEBHOOK`: Token or webhook URL from Railway settings.
* `RAILWAY_SERVICE_NAME`: (Optional) Target Railway service name.

---

## 🗺️ Roadmap & Planned Enhancements

* [x] Google OAuth 2.0 single-use code exchange flow
* [x] S3 Pre-signed expiring image URLs
* [x] Daily automated Cron Job for vaccine alerts
* [x] Rate Limiting (Throttler) and Helmet security hardening
* [x] Prometheus metrics & custom HTTP/domain telemetry integration (`/metrics`)
* [x] Grafana Alloy & Grafana Cloud telemetry pipeline (`config.alloy.example`)
* [x] Containerized local database infrastructure (`docker-compose.yml`)
* [ ] Multi-image gallery for pets
* [ ] Push Notifications (WebPush / FCM) and transactional emails (Resend / AWS SES)
* [ ] Redis cache layer for high-throughput read operations
* [ ] Export full pet medical history to PDF
* [x] CI/CD pipeline via GitHub Actions with automated test runs, linting, and Docker/Railway deployment

---

## 📝 Changelog

See [`CHANGELOG.md`](./CHANGELOG.md) for a detailed history of features, fixes, and architectural updates.

---

## 👤 Author

**Matheus Iost**

* GitHub: [@theusinhoiost](https://github.com/theusinhoiost)
* Frontend Repository: [PetTracker-Web](https://github.com/theusinhoiost/PetTracker-web)
* Live Application: [pet-tracker-web.vercel.app](https://pet-tracker-web.vercel.app)

---

## 📄 License

This project is licensed under the **UNLICENSED** terms (private/proprietary).
