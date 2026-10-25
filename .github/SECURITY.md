# Security Policy

## Supported Versions

We actively maintain and provide security updates for the current production release of Dari Karnataka Travel Planner:

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

We take the security of Dari Karnataka Travel Planner seriously. If you believe you have discovered a security vulnerability, please report it responsibly.

### How to Report
- **Email:** Please send an email to `varshithvardhan@gmail.com` with the subject line `[SECURITY] Dari Karnataka Travel Planner`.
- **Details to Include:**
  - Description of the vulnerability and its potential impact.
  - Step-by-step reproduction steps or a minimal proof of concept.
  - Recommended mitigation or remediation if available.

### What to Expect
- **Acknowledgment:** We will acknowledge receipt of your vulnerability report within **48 hours**.
- **Assessment:** We will investigate and assess the vulnerability within **5 business days**.
- **Fix & Disclosure:** We will work on a fix promptly and coordinate public disclosure once the patch is verified and deployed.

Please **do not** create public GitHub issues or discussions for sensitive security vulnerabilities until they have been reviewed and addressed.

## Built-in Security Architecture

Dari implements defense-in-depth principles:
1. **Server-Side Secret Isolation:** AI keys (`GROQ_API_KEY`, `GEMINI_API_KEY`) remain strictly server-side and are never exposed to browser clients.
2. **Strict Schema Validation:** All incoming and outgoing data payloads are strictly validated using runtime [Zod](https://zod.dev) schemas (`PlanRequestSchema`, `PlanSchema`).
3. **API Abuse Protection:** The `/api/plan` endpoint enforces sliding-window rate limiting and request payload size caps (32KB limit).
4. **Data Privacy:** User itineraries, search choices, and saved trips remain local to the user's browser device (`localStorage`) with no unnecessary database profiling.
