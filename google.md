# Step-by-Step Guide: Setting Up Google OAuth 2.0 for Portfolio SaaS

This guide walks you through creating and configuring Google OAuth 2.0 credentials in the Google Cloud Console to get the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables required for social login on your application.

---

## 📋 Prerequisites

- A Google / Gmail account.
- The application running locally (`http://localhost:3000` or `http://localhost:5173` for frontend, `http://localhost:5000` for backend).

---

## 🛠️ Step 1: Go to Google Cloud Console

1. Open your browser and navigate to the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Sign in with your Google account.

---

## 📁 Step 2: Create a New Project

1. Click on the project dropdown menu at the top of the screen (next to the Google Cloud logo).
2. Click **New Project** in the top-right corner of the modal.
3. Enter a project name, for example: `Portfolio-SaaS`.
4. Click **Create** and wait a few seconds for Google to set up the project.
5. Make sure the newly created project is selected in the top navigation bar.

---

## 🎨 Step 3: Configure the OAuth Consent Screen

Before generating credentials, you must configure the consent screen that users see when signing in.

1. In the left navigation sidebar, go to **APIs & Services** → **OAuth consent screen**.
2. Select **External** as the User Type (allowing any user with a Google Account to log in).
3. Click **Create**.

### Fill in App Information:

- **App name**: `Ink & Ledger Portfolio SaaS` (or your app name)
- **User support email**: Choose your email address from the dropdown.
- **Application home page**:
  - **Local**: `http://localhost:3000` (or `http://localhost:5173`)
  - **Railway**: `https://portfolio-frontend-production.up.railway.app`
- **Application privacy policy link**:
  - **Local**: `http://localhost:3000/privacy` (or `http://localhost:5173/privacy`)
  - **Railway**: `https://portfolio-frontend-production.up.railway.app/privacy`
- **Application terms of service link**:
  - **Local**: `http://localhost:3000/terms` (or `http://localhost:5173/terms`)
  - **Railway**: `https://portfolio-frontend-production.up.railway.app/terms`
- **Authorized domains**:
  - **Local Development**: Leave empty (Google allows `localhost` by default without listing it).
  - **Railway Deployment**: Click **+ Add Domain** and enter **`up.railway.app`** and **`railway.app`** (or your custom domain like `myportfolio.com`).
- **Developer contact information**: Enter your email address.

4. Click **Save and Continue**.

### Scopes:

1. Click **Add or Remove Scopes**.
2. Select the following essential scopes:
   - `.../auth/userinfo.email` (View your email address)
   - `.../auth/userinfo.profile` (View your basic profile info)
   - `openid`
3. Click **Update** and then **Save and Continue**.

### Test Users (For Development):

1. Under **Test users**, click **+ Add Users**.
2. Enter your Google email address (and any other test accounts).
3. Click **Add**, then click **Save and Continue**.

---

## 🔑 Step 4: Create OAuth 2.0 Credentials

1. In the left navigation sidebar, go to **APIs & Services** → **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. Set **Application type** to **Web application**.
4. Set **Name** to: `Portfolio SaaS Web Client`.

### Configure Authorized Origins & Redirect URIs:

- **Authorized JavaScript origins**:
  Click **+ Add URI** and add:
  - `http://localhost:5000`
  - `http://localhost:3000`
  - `http://localhost:5173` (if using Vite default dev server)

- **Authorized redirect URIs**:
  Click **+ Add URI** and add:
  - `http://localhost:5000/api/auth/google/callback`

> ⚠️ **Important:** The redirect URI must match `http://localhost:5000/api/auth/google/callback` exactly.

5. Click **Create**.

---

## 💾 Step 5: Save Credentials to `.env`

A modal titled **OAuth client created** will pop up displaying your credentials:

1. Copy **Client ID**.
2. Copy **Client Secret**.

Open your `.env` file in the root of the project (`PORTFOLIO-SYS\.env`) and paste the values:

```env
# ── Google OAuth 2.0 ─────────────────────────────────────────
GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here

# ── Base URLs ────────────────────────────────────────────────
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

---

## 🚀 Step 6: Test Google OAuth Sign-Up & Sign-In

1. Restart your backend server so it picks up the new `.env` variables:
   ```bash
   cd backend
   npm run dev
   ```
2. Open your frontend in the browser (`http://localhost:3000/register`).
3. Click the **Google** button under _One-Click Social Registration_.
4. You will be redirected to Google's sign-in screen.
5. After logging in with Google:
   - **New Users**: Will be redirected to `/register/oauth` to enter their **Desired Subdomain Slug** and **Primary Profession**.
   - **Existing Users**: Will automatically log into their admin dashboard (`/admin/dashboard`).

---

## 🚂 Step 7: Configuring Google OAuth for Railway Deployment

When deploying your application to **Railway** (or any production host), you need to configure your production domains in both Google Cloud Console and Railway Environment Variables.

### A. Identify your Railway Service URLs

1. Log into your **[Railway Dashboard](https://railway.app/)**.
2. Select your project.
3. Note your generated domains for both backend and frontend services:
   - **Backend Service URL**: e.g., `https://portfolio-backend-production.up.railway.app`
   - **Frontend Service URL**: e.g., `https://portfolio-frontend-production.up.railway.app`
     _(If you attached custom domains like `https://api.yourdomain.com` and `https://yourdomain.com`, use those instead)._

---

### B. Add Railway URLs to Google Cloud Console

1. Go back to **[Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)**.
2. Click the edit icon next to your **OAuth 2.0 Client ID**.
3. Under **Authorized JavaScript origins**, click **+ Add URI** and add:
   - `https://portfolio-backend-production.up.railway.app`
   - `https://portfolio-frontend-production.up.railway.app`
4. Under **Authorized redirect URIs**, click **+ Add URI** and add:
   - `https://portfolio-backend-production.up.railway.app/api/auth/google/callback`
5. Click **Save**.

---

### C. Set Railway Environment Variables

#### 1. In Railway Backend Service Settings:

Go to your **Backend Service** → **Variables** tab and set:

```env
BACKEND_URL=https://portfolio-backend-production.up.railway.app
FRONTEND_URL=https://portfolio-frontend-production.up.railway.app
CORS_ORIGIN=https://portfolio-frontend-production.up.railway.app
GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret
SESSION_SECRET=your_secure_random_session_secret_32_chars
JWT_SECRET=your_secure_random_jwt_secret_32_chars
```

#### 2. In Railway Frontend Service Settings:

Go to your **Frontend Service** → **Variables** tab and set:

```env
VITE_API_BASE_URL=https://portfolio-backend-production.up.railway.app/api
```

---

### D. Publish Consent Screen for Production

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**.
2. Click **Edit App** and update the domain URLs to your Railway production frontend:
   - **Application home page**: `https://portfolio-frontend-production.up.railway.app`
   - **Application privacy policy link**: `https://portfolio-frontend-production.up.railway.app/privacy`
   - **Application terms of service link**: `https://portfolio-frontend-production.up.railway.app/terms`
   - **Authorized domains**: Add `railway.app` (or your custom domain like `myportfolio.com`)
3. Click **Publish App** under _Testing_.
4. Confirm publishing so that any Google user can sign in to your Railway app without needing to be added as a test user.

---

## 🛡️ Production Deployment Checklist

When deploying to production (e.g., Vercel, Railway, Heroku, or Custom Domain):

1. Go back to Google Cloud Console → **Credentials** → Edit your OAuth Client ID.
2. Add your production domain under **Authorized JavaScript origins**:
   - `https://yourdomain.com`
3. Add your production backend callback URI under **Authorized redirect URIs**:
   - `https://api.yourdomain.com/api/auth/google/callback`
4. Go to **OAuth consent screen** and click **Publish App** to switch from _Testing_ to _In Production_.
