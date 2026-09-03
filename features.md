# Portfolio SaaS Platform — Comprehensive Feature Roadmap & Technical Specifications

This document outlines all platform capabilities, completed milestones, and pending feature specifications. Every feature is numbered, categorized by operational domain, and accompanied by concrete implementation details.

---

## 🟢 Category 1: AI Engines & Career Intelligence (Google Gemini Flash)

### 1.1 In-Editor AI Bio & Summary Optimizer
* **Status**: ⏳ Pending
* **Specification**: Replace heuristic regex substitutions with direct calls to Google Gemini (`gemini-3.6-flash`).
* **UI Location**: `ProfileEditorPage.tsx` under General/About section ("✨ Polish with Gemini" button).
* **Backend Endpoint**: `POST /api/v1/ai/enhance-summary`
* **Behavior**: Accepts raw bio text and desired professional persona, outputs 3 curated variations:
  1. *Executive / Concise*: 2–3 sentence high-impact summary focusing on leadership and business outcomes.
  2. *Technical / Detail-Oriented*: Highlights architecture, stack proficiencies, and engineering rigor.
  3. *Creative / Story-Driven*: Engaging narrative highlighting career trajectory and passions.

### 1.2 STAR Method Experience Bullet-Point Rewriter
* **Status**: ⏳ Pending
* **Specification**: Takes rough bullet points written by the user and rewrites them according to the **STAR** framework (Situation, Task, Action, Result) with strong action verbs and quantified impact placeholders.
* **UI Location**: `ProfileEditorPage.tsx` experience modal next to responsibility inputs.
* **Backend Endpoint**: `POST /api/v1/ai/rewrite-bullet`
* **Behavior**: Example input `"worked on api performance"` → Outputs `"Architected and optimized RESTful endpoints, reducing p99 latency by 35% through Redis caching and query batching."`

### 1.3 ATS Resume & Job Description Compatibility Matcher
* **Status**: ⏳ Pending
* **Specification**: Allows candidates to paste a target job description (e.g., job listing from LinkedIn/Indeed) and compares it against their active portfolio profile.
* **UI Location**: New dedicated tab/modal under `CvImportPage.tsx` or `DashboardPage.tsx`.
* **Backend Endpoint**: `POST /api/v1/ai/ats-match`
* **Features**:
  * **Match Score**: 0–100% match indicator.
  * **Missing Keywords**: Explicit breakdown of missing technical skills, domain tools, and soft competencies.
  * **Actionable Recommendations**: Suggestions on which experiences to emphasize or keywords to add to bypass ATS screening filters.

### 1.4 Tailored AI Cover Letter Generator
* **Status**: ⏳ Pending
* **Specification**: Generates a bespoke, ready-to-send cover letter synthesized from the candidate's verified portfolio achievements mapped directly against a job description.
* **UI Location**: Dashboard quick actions or Export menu.
* **Backend Endpoint**: `POST /api/v1/ai/generate-cover-letter`
* **Output**: Downloadable as formatted PDF or Markdown/text copy to clipboard.

### 1.5 Automated Project Case-Study Expander
* **Status**: ⏳ Pending
* **Specification**: Takes a simple project title, repo link, and tech stack tags, then drafts a structured case study comprising:
  1. *Problem Statement & Context*
  2. *Architecture & Tech Stack Decisions*
  3. *Technical Challenges & Solutions*
  4. *Measurable Results & Key Takeaways*
* **UI Location**: `ProfileEditorPage.tsx` project modal ("✨ Generate Case Study").
* **Backend Endpoint**: `POST /api/v1/ai/expand-project`

---

## 🔵 Category 2: Recruiter Lead Generation & Instant Contact Automation

### 2.1 vCard (.vcf) Instant Mobile Contact Download
* **Status**: ⏳ Pending
* **Specification**: Generate and stream a standard `.vcf` (vCard 3.0) file on the fly from the user's profile data.
* **UI Location**: Public portfolio Hero section (button: `"Save Contact (.vcf)"` next to Resume Download).
* **Route**: `GET /api/v1/portfolio/:subdomain/vcard`
* **Payload Fields**: Full name, current job title, contact email, phone number, public portfolio URL, profile avatar (base64 photo embed), and location.
* **Recruiter Impact**: One tap allows mobile recruiters to save the candidate directly to iOS/Android address books with all social links pre-populated.

### 2.2 Instant Webhook Notifications for Contact Inquiries (Slack / Discord / Telegram)
* **Status**: ⏳ Pending
* **Specification**: When a visitor submits the portfolio contact form, the backend pushes an immediate rich webhook notification to the owner's preferred chat platform.
* **Settings UI**: `UserSettingsPage.tsx` under a new "Notifications & Webhooks" card (fields for Discord Webhook URL and Slack Incoming Webhook URL).
* **Database Schema**: Add `discordWebhookUrl String?` and `slackWebhookUrl String?` to `Profile` model.
* **Notification Payload**: Embed card containing sender name, sender email, subject, message preview, and a direct link to reply or view in the admin dashboard.

### 2.3 Interactive Appointment Booking Embed (Calendly / Cal.com)
* **Status**: ⏳ Pending
* **Specification**: Embed scheduling widgets directly on the public portfolio page for recruiter interviews or client consultations.
* **Settings UI**: `CustomizerPage.tsx` or `UserSettingsPage.tsx` (field: `bookingUrl`).
* **Display**: A floating or inline `"Schedule a Call"` card in the public portfolio with native popup modal supporting Calendly, Cal.com, or Google Calendar appointment links.

### 2.4 One-Click Direct WhatsApp Inquiry Button
* **Status**: ⏳ Pending
* **Specification**: Configurable floating or hero WhatsApp CTA button formatted with pre-filled greeting text (e.g., `https://wa.me/{phone}?text=Hi%20{name},%20I%20saw%20your%20portfolio...`).
* **Settings UI**: Toggle in `CustomizerPage.tsx` under Social & Contact links.

---

## 🟣 Category 3: Developer & Content Ecosystem Sync

### 3.1 Live GitHub Repository & Contribution Heatmap Sync
* **Status**: ⏳ Pending
* **Specification**: Automated synchronization with the candidate's public GitHub profile using the GitHub REST/GraphQL API.
* **Features**:
  * **Auto-Import Pinned Repos**: Pull repository name, description, primary language, star count, and fork count directly into portfolio projects.
  * **Contribution Activity Graph**: Render a visual SVG GitHub contribution heatmap for the last 12 months.
  * **Tech Stack Breakdown**: Automatically compute language percentage distributions across public repos.
* **Backend Route**: `POST /api/v1/integrations/github/sync`

### 3.2 Medium / Dev.to / Hashnode RSS Article Aggregator
* **Status**: ⏳ Pending
* **Specification**: Fetch and cache technical blog posts dynamically using RSS feeds.
* **Settings UI**: Add RSS feed URL in `ProfileEditorPage.tsx` under Publications/Articles.
* **Behavior**: Parses RSS XML to JSON on a 6-hour Redis cache TTL, automatically rendering interactive blog cards with read-time estimates, cover thumbnails, and direct links.

### 3.3 Rich Interactive Project Media Embeds
* **Status**: ⏳ Pending
* **Specification**: Extend the `Project` model with `embedType` and `embedUrl` fields.
* **Supported Embed Formats**:
  * **Figma**: Interactive prototype viewer iframe.
  * **YouTube / Vimeo / Loom**: Embedded video demo player.
  * **CodePen / Replit**: Live interactive code sandbox.
  * **Spotify / SoundCloud**: Embedded audio player for podcasts/audio engineers.

---

## 🟡 Category 4: SEO, Social Share Cards & Discoverability

### 4.1 Dynamic OpenGraph (OG) Meta Tags & Social Share Cards
* **Status**: ⏳ Pending
* **Specification**: Dynamically serve tailored OpenGraph and Twitter card meta tags when a portfolio link is shared across LinkedIn, Twitter/X, WhatsApp, Slack, or iMessage.
* **Meta Tags**:
  * `og:title`: `"{FullName} — {Title}"`
  * `og:description`: Bio or career objective snippet.
  * `og:image`: Dynamic social preview card showing avatar, verified badge, and skill pills.
  * `twitter:card`: `summary_large_image`.
* **Implementation**: Express SSR meta-injection middleware on `/p/:subdomain` requests before handing off to the SPA bundle.

### 4.2 Automated JSON-LD Schema.org Microdata
* **Status**: ⏳ Pending
* **Specification**: Inject Google-compliant structured data into the public portfolio DOM:
  * Schema type `Person`: Name, job title, email, telephone, URL, sameAs (social links), worksFor, alumniOf.
  * Schema type `ProfilePage`: Breadcrumbs and indexing hints.
* **Benefit**: Guarantees rich snippets in Google Search results when recruiters Google the candidate's name.

### 4.3 Custom Favicon & Web Manifest Upload
* **Status**: 🟢 Implemented
* **Specification**: Allow tenants to upload a custom square icon (`.ico` / `.png` / `.svg`) displayed in browser tabs and mobile home-screen bookmarks.
* **Settings UI**: `CustomizerPage.tsx` under Favicon, PWA & Analytics card.
* **PWA Manifest Route**: `GET /api/v1/portfolio/public/:subdomain/manifest.json`

### 4.4 Automated Sitemap & Robots.txt Generator
* **Status**: 🟢 Implemented
* **Specification**: Public routes `GET /sitemap.xml` listing all published subdomain portfolios with `<lastmod>` timestamps, and `GET /robots.txt` honoring privacy toggles. Mounts at root and `/api/v1/portfolio/`.

---

## 🔒 Category 5: Security, Access Control & Privacy

### 5.1 Password-Protected Portfolios & Secret NDA Links
* **Status**: ⏳ Pending
* **Specification**: Enable freelancers and enterprise developers to safeguard confidential projects under NDA.
* **Capabilities**:
  * **Portfolio-Level Lock**: Protect the entire portfolio behind a passphrase prompt.
  * **Project-Level Lock**: Allow public viewing of the profile, but blur/lock specific featured projects requiring a passkey or verified access request.
  * **Time-Limited Guest Passes**: Generate shareable URLs with expirable cryptographic tokens (`?access_token=...`) valid for 24–72 hours for specific recruiters.

### 5.2 Real Two-Factor Authentication (2FA) via TOTP
* **Status**: ⏳ Pending *(Current implementation in UserSettingsPage.tsx is mock UI)*
* **Specification**: Replace mock timer with server-side RFC 6238 TOTP engine.
* **Backend Dependencies**: `otplib` or `speakeasy`, `qrcode`.
* **Database Schema**: Add `twoFactorSecret String?`, `twoFactorEnabled Boolean @default(false)`, `twoFactorBackupCodes String[]` to `User` model.
* **Flow**:
  1. Generate Base32 secret and QR code URI (`otpauth://totp/...`).
  2. Require verification of 6-digit code before activating.
  3. Store hashed single-use recovery backup codes.
  4. Challenge for TOTP token on `POST /api/v1/auth/login`.

### 5.3 Granular Public Privacy Toggles
* **Status**: 🟢 Implemented
* **Current Features**:
  * Toggle visibility for email (`isPublicEmail`), phone (`isPublicPhone`), location (`isPublicLocation`), address (`isPublicAddress`), and references (`isPublicReferences`).
  * Honeypot anti-spam protection on contact form.

---

## 📈 Category 6: Analytics, Metrics & Reporting

### 6.1 Native Traffic & Engagement Analytics
* **Status**: 🟢 Implemented
* **Functionality**: Total profile views, unique visitors, resume PDF downloads count, contact messages count, verified reviews count, visitor action rate (conversion %), views & downloads trend area chart, device distribution (Desktop/Mobile/Tablet), top referral channels (LinkedIn, GitHub, Google, Twitter), top browsers, and live 25-event activity stream. Supports 7D, 30D, 90D, and All-Time filtering.

### 6.2 External Analytics Measurement ID Injection
* **Status**: 🟢 Implemented
* **Specification**: Allows users to configure custom measurement IDs in `CustomizerPage.tsx`:
  * Google Analytics 4 (GA4 `G-XXXXXXXXXX` with dynamic `gtag.js` injection)
  * Plausible Analytics Custom Domain (with dynamic script injection)
* **Implementation**: Injected dynamically in `PublicPortfolioPage.tsx` without exposing administrative tokens or cookies.

---

## 💳 Category 7: SaaS Monetization, Billing & Multi-Tenant Infrastructure

### 7.1 Tiered Subscription Engine (Free vs. Pro vs. Agency)
* **Status**: ⏳ Pending
* **Specification**: Introduce role and plan constraints in database and middleware:
  * **Free Tier**: 1 basic theme, standard subdomain (`username.myportfolio.com`), watermark footer ("Powered by Portfolio SaaS"), standard AI scans (3/month).
  * **Pro Tier ($9–$15/mo)**: All 20 themes, unlimited Gemini AI enhancement & ATS matching, custom domain connection, white-label branding (no watermark), secret NDA links.
  * **Agency / Recruiter Tier ($29–$49/mo)**: Multiple client profiles under one master login, custom client branding, exportable candidate dossiers.

### 7.2 Stripe Billing & Checkout Portal Integration
* **Status**: ⏳ Pending
* **Backend Dependencies**: `stripe` SDK.
* **Endpoints**:
  * `POST /api/v1/billing/create-checkout-session`
  * `POST /api/v1/billing/create-portal-session`
  * `POST /api/v1/billing/webhook` (handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`)
* **Database Schema**: Add `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`, `planExpiresAt` to `User` model.

### 7.3 Automated Custom Domain Connection & SSL Engine
* **Status**: ⏳ Pending
* **Specification**: Allow users to bind their own apex or subdomain (e.g., `www.alexdev.com` or `portfolio.janedoe.me`).
* **Workflow**:
  1. User inputs custom domain in settings.
  2. System provides DNS CNAME record instructions (`portfolio.janedoe.me CNAME cname.myportfolio.com`).
  3. Background worker runs DNS lookup to verify propagation.
  4. Nginx reverse-proxy or Cloudflare for Platforms / Caddy automatically provisions Let's Encrypt SSL certificate.

### 7.4 White-Label Branding Switch
* **Status**: ⏳ Pending
* **Specification**: A simple boolean toggle in `PortfolioCustomization` (`hidePlatformBadge Boolean @default(false)`). When enabled by Pro users, completely strips the footer "Powered by Portfolio SaaS" badge and metadata.

---

## 📄 Category 8: Document Generation & Export Upgrades

### 8.1 Multi-Template Resume PDF Generator
* **Status**: 🟢 Partially Implemented / ⏳ Template Variations Pending
* **Current**: Single two-column PDF generator with QR code embed.
* **Pending Styles**:
  1. *Executive Formal*: Classic single-column serif design preferred by banking, law, and corporate recruiters.
  2. *Tech Minimalist*: Clean monospace/sans-serif layout with compact skill matrices.
  3. *Creative Modern*: Vibrant header accents, bold typography, and visual timeline indicators.

---

## 🚀 Recommended Implementation Priority Matrix

| Item # | Feature Name | Category | Effort | Recruiter / User Value |
| :---: | :--- | :--- | :---: | :---: |
| **2.1** | **vCard (.vcf) Instant Contact Download** | Recruiter Lead Gen | ⚡ 1–2 hours | Very High |
| **1.1** | **Gemini AI Bio & Summary Optimizer** | AI Intelligence | 🚀 2–3 hours | Very High |
| **1.2** | **STAR Method Experience Bullet Rewriter** | AI Intelligence | 🚀 2–3 hours | Very High |
| **2.2** | **Instant Contact Webhooks (Discord/Slack)** | Recruiter Lead Gen | ⚡ 2 hours | High |
| **1.3** | **ATS Resume & Job Description Matcher** | AI Intelligence | 🌟 4–6 hours | Highest Differentiation |
| **3.1** | **GitHub Repositories Live Auto-Sync** | Ecosystem Sync | 🛠 3–4 hours | High (Devs) |
| **4.1** | **Dynamic OpenGraph Social Share Cards** | SEO & Discoverability | 🛠 3 hours | High |
| **5.1** | **Password-Protected NDA Projects** | Security | 🛠 3–4 hours | High |
| **5.2** | **Real TOTP Two-Factor Auth (2FA)** | Security | 🛠 4 hours | High |
| **7.1** | **Stripe SaaS Subscription Billing** | Monetization | 💎 6–8 hours | Core Business Metric |
