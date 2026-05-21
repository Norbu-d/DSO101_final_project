# TenPhel CI/CD Pipeline Documentation

## Overview

This document explains the full CI/CD (Continuous Integration / Continuous Deployment) pipeline for the TenPhel project. The pipeline is automated through GitHub Actions and runs every time code is pushed to `main` or a Pull Request is opened against `main`.

---

## Files That Power the Pipeline

| File | Purpose |
|------|---------|
| `.github/workflows/deploy.yml` | The main pipeline definition — all 12 stages live here |
| `Dockerfile` | Defines how the app is packaged into a Docker image (3-stage: install → build → run) |
| `docker-compose.yml` | Used for running the app locally with Docker |
| `sonar-project.properties` | Tells SonarCloud which files to scan and how to identify the project |
| `eslint.config.mjs` | ESLint rules used during the Install & Test stage |
| `next.config.ts` | Next.js config — must have `output: 'standalone'` for the Docker image to work |
| `package.json` | Defines `npm run lint` and `npm run build` scripts called by the pipeline |
| `tsconfig.json` | TypeScript config used during the build stage |
| `src/` | All application source code that gets linted, built, scanned, and deployed |

---

## Pipeline Stages (12 Total)

The pipeline runs in a strict order. Each stage must pass before the next one starts (except security/quality stages which are set to warn-only so they never block a deploy).

```
STAGE 1   Setup Environment
    |
STAGE 2   Secret Scanning & Prevention
    |
STAGE 3   Install & Test
    |
STAGE 4   Build Next.js Application
    |
STAGE 5   SonarCloud Code Quality
    |
STAGE 6   Trivy Filesystem Scan
    |
STAGE 7   Build Docker Image
    |
STAGE 8   Trivy Docker Image Scan
    |
    ├── (push to main) ─────────────────────────────────────────────┐
    |                                                               |
STAGE 9   Push Docker Image                                         |
    |                                                               |
STAGE 10a Deploy to Vercel (Production)      STAGE 10b Deploy to Vercel (Preview)  [PR only]
    |                                               |
    └───────────────────┬───────────────────────────┘
                        |
STAGE 11  OWASP ZAP Dynamic Scan
                        |
STAGE 12  Pipeline Status
```

---

### Stage 1 — Setup Environment

**What it does:** Initialises the pipeline runner, prints the branch name, commit SHA, and event type. Sets a flag (`is_main_push`) that later stages use to decide whether to deploy to production or preview.

**Files used:** None directly — just the runner environment.

---

### Stage 2 — Secret Scanning & Prevention

**What it does:** Uses **Gitleaks** to scan the entire Git history for accidentally committed secrets (API keys, passwords, tokens). If a secret is found, it logs a warning.

**Tool:** `gitleaks/gitleaks-action@v2`
**Behaviour:** Warn-only (`continue-on-error: true`) — a finding does not block the pipeline.
**Files scanned:** All files in the repository including Git history.

> **Note:** For public repos this works without any extra setup. For private repos a `GITLEAKS_LICENSE` secret is required in GitHub repository settings.

---

### Stage 3 — Install & Test

**What it does:** Installs all Node.js dependencies and runs ESLint to catch code quality and syntax errors.

**Files used:**
- `package.json` / `package-lock.json` — dependency definitions
- `eslint.config.mjs` — lint rules
- `src/**/*.tsx` / `src/**/*.ts` — all source files are linted

**Behaviour:** This is a **critical** stage. If lint fails, the pipeline stops and nothing is deployed.

---

### Stage 4 — Build Next.js Application

**What it does:** Runs `npm run build` to verify the Next.js application compiles into a production build without errors. This catches TypeScript errors and broken imports before they reach Docker.

**Files used:**
- `next.config.ts` — Next.js configuration
- `tsconfig.json` — TypeScript configuration
- `src/` — all application source files
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/auth/page.tsx`, etc.

**Behaviour:** Critical stage — build failure blocks the pipeline.

---

### Stage 5 — SonarCloud Code Quality

**What it does:** Sends the source code to **SonarCloud** for a deep static analysis. SonarCloud checks for:
- Code smells and maintainability issues
- Potential bugs
- Security hotspots in the code logic
- Code duplication
- Test coverage (if tests are added later)

**Files used:**
- `sonar-project.properties` — tells SonarCloud the project key, organisation, and which files to scan
- `src/` — all source files are analysed

**Where to see results:**
- Go to [sonarcloud.io](https://sonarcloud.io) → sign in → your project dashboard
- On every Pull Request, SonarCloud also posts a comment directly on the PR with a quality gate result

**Behaviour:** Warn-only — quality issues are reported but do not block the deploy.

---

### Stage 6 — Trivy Filesystem Scan

**What it does:** Uses **Trivy** to scan the project's source files and `package.json` dependencies for known CVEs (Common Vulnerabilities and Exposures). This checks if any npm package you are using has a known security vulnerability.

**Tool:** `aquasecurity/trivy-action@master` with `scan-type: fs`
**Files scanned:** The entire repository workspace, focusing on `package.json` and `package-lock.json`.

**Where to see results:**
- Downloadable as `trivy-fs-report` artifact from the GitHub Actions run page (kept for 7 days)
- The artifact is a plain-text table listing vulnerable packages with severity (CRITICAL / HIGH)

**Behaviour:** Warn-only.

---

### Stage 7 — Build Docker Image

**What it does:** Builds the production Docker image using the `Dockerfile`. The image is saved locally on the runner as a compressed `.tar.gz` file and uploaded as a GitHub Actions artifact so the next stage can download and scan it.

**Files used:**
- `Dockerfile` — 3-stage build (deps → builder → runner)
- `.dockerignore` — files excluded from the image
- `src/` and all source files (copied into the builder stage)

**Behaviour:** Critical stage — if Docker build fails, nothing is pushed or deployed.

> The Docker image is NOT pushed to Docker Hub here. It is only built and saved. Pushing only happens after the security scan in Stage 9.

---

### Stage 8 — Trivy Docker Image Scan

**What it does:** Downloads the Docker image artifact from Stage 7 and scans the image layers for known OS and library vulnerabilities (e.g., vulnerabilities in the `node:20-alpine` base image).

**Tool:** `aquasecurity/trivy-action@master` with `scan-type: image`

**Where to see results:**
- Downloadable as `trivy-docker-report` artifact from the GitHub Actions run page (kept for 7 days)
- Plain-text table showing CVEs found inside the Docker image layers

**Behaviour:** Warn-only.

---

### Stage 9 — Push Docker Image *(push to main only)*

**What it does:** Loads the scanned Docker image and pushes it to Docker Hub under two tags:
- `latest` — always points to the most recent build
- `<commit-sha>` — a permanent, traceable tag for that exact commit

**Where to see results:** [hub.docker.com](https://hub.docker.com) → your repository → Tags tab.

**Behaviour:** Only runs on direct push to `main`. Skipped for Pull Requests.

---

### Stage 10 — Deploy to Vercel

Two variants run depending on the event:

**10a — Deploy to Vercel (Production)** *(push to main only)*
- Deploys the app to the live production URL
- Runs after Docker push succeeds

**10b — Deploy to Vercel (Preview)** *(Pull Requests only)*
- Deploys a temporary preview URL unique to the PR
- Posts the preview URL as a comment on the Pull Request
- This preview URL is passed to Stage 11 for ZAP scanning

---

### Stage 11 — OWASP ZAP Dynamic Scan

**What it does:** Runs a **live security scan** against the deployed application. Unlike Trivy which scans files and images, ZAP actually visits the running website, crawls every page, and attempts to find real vulnerabilities such as:
- XSS (Cross-Site Scripting)
- SQL Injection
- Missing security headers
- Exposed sensitive information
- Insecure cookies

**Tool:** `zaproxy/action-baseline@v0.14.0` (Baseline Scan mode)

**Target:**
- On a **Pull Request**: scans the Vercel preview URL (captured from Stage 10b)
- On a **push to main**: scans the production URL stored in the `PRODUCTION_URL` secret

**Where to see results:**
- Downloadable as `zap-security-report` artifact from the GitHub Actions run page (kept for 7 days)
- The artifact is an **HTML report** (`report_html.html`) — open it in any browser to see a full colour-coded security report with risk ratings, descriptions, and recommendations for each finding

**Behaviour:** Warn-only — findings are reported but do not block the deploy.

---

### Stage 12 — Pipeline Status

**What it does:** Always runs last (even if earlier stages failed) and prints a clean summary table of every stage's result to the GitHub Actions log. It will mark the overall pipeline as **FAILED** only if a critical stage (Install & Test, Build Application, or Build Docker Image) failed.

---

## Secrets Required in GitHub

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

| Secret Name | Description |
|-------------|-------------|
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | Found in Vercel project settings |
| `VERCEL_PROJECT_ID` | Found in Vercel project settings |
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (not your password) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SONAR_TOKEN` | From sonarcloud.io → My Account → Security → Generate Token |
| `PRODUCTION_URL` | Your live Vercel URL e.g. `https://tenphel.vercel.app` |
| `GITLEAKS_LICENSE` | Only needed for private repos — skip if repo is public |

---

## Where to Find All Reports

| Report | Location | Format | Kept For |
|--------|----------|--------|----------|
| SonarCloud quality analysis | sonarcloud.io dashboard + PR comment | Web dashboard | Permanent |
| Trivy filesystem scan | GitHub Actions → your run → Artifacts → `trivy-fs-report` | Plain text table | 7 days |
| Trivy Docker image scan | GitHub Actions → your run → Artifacts → `trivy-docker-report` | Plain text table | 7 days |
| OWASP ZAP security scan | GitHub Actions → your run → Artifacts → `zap-security-report` | HTML (open in browser) | 7 days |

**How to download an artifact:**
1. Go to your GitHub repository
2. Click the **Actions** tab
3. Click on any workflow run
4. Scroll to the bottom of the run page
5. Under **Artifacts**, click the report name to download a `.zip` file
6. Unzip it and open the `.html` file in your browser

---

## How to Use ZAP Desktop for Manual Scanning

You have the OWASP ZAP desktop application installed. Use it to run a manual scan against your local dev server or the Vercel preview URL whenever you want a full interactive scan (more thorough than the automated baseline scan in the pipeline).

### Step-by-step

**1. Start your target**

Option A — scan localhost:
```bash
cd ~/Desktop/DSO101_final_project
npm run dev
# App runs at http://localhost:3000
```

Option B — scan the Vercel preview URL directly (no local server needed).

---

**2. Open OWASP ZAP**

Launch the ZAP application from your Applications folder.

---

**3. Run an Automated Scan**

1. On the ZAP home screen click **Automated Scan**
2. In the **URL to attack** field enter:
   - `http://localhost:3000` (local), or
   - your Vercel preview URL e.g. `https://tenphel-abc123.vercel.app`
3. Leave **Use traditional spider** checked
4. Click **Attack**
5. ZAP will spider (crawl) the site, then run the active scanner
6. Wait for the progress bar to complete — this takes 5–15 minutes

---

**4. Review the Results**

Once the scan finishes:
- The **Alerts** tab at the bottom shows every vulnerability found
- Each alert has a **Risk** rating: Red = High, Orange = Medium, Yellow = Low, Blue = Informational
- Click any alert to see the full description, the affected URL, and the recommended fix

---

**5. Generate a Report**

1. In the ZAP menu bar click **Report**
2. Click **Generate Report...**
3. Choose your format:
   - **HTML** — best for sharing, opens in any browser
   - **PDF** — good for submitting as coursework
   - **XML / JSON** — for machine-readable output
4. Choose a save location (e.g. your Desktop)
5. Click **Generate**

The HTML report includes:
- Executive summary with risk counts
- Full list of alerts with risk level, description, evidence, and solution
- Request/response details for each finding

---

## Pipeline Behaviour by Event Type

| Stage | Pull Request to main | Push to main |
|-------|---------------------|--------------|
| Setup Environment | runs | runs |
| Secret Scanning | runs | runs |
| Install & Test | runs | runs |
| Build Application | runs | runs |
| SonarCloud Quality | runs | runs |
| Trivy Filesystem Scan | runs | runs |
| Build Docker Image | runs | runs |
| Trivy Docker Image Scan | runs | runs |
| Push Docker Image | **skipped** | runs |
| Deploy Production | **skipped** | runs |
| Deploy Preview | runs | **skipped** |
| OWASP ZAP Scan | scans preview URL | scans production URL |
| Pipeline Status | runs | runs |
