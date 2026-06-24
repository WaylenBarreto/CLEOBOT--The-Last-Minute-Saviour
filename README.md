# ⚡ The Last-Minute Life Saver (Cleobot)

**The Last-Minute Life Saver** is a high-performance, premium AI-powered productivity dashboard built to de-stress, time-block, and automate your urgent tasks when deadlines are crashing down. 

Designed for high-stress scenarios, it provides conversational task de-stressing, direct agent-driven automations, and proactive background defense mapping.

---

## 🚀 Key Features

### 1. Crisis Game Planner
* Converts raw, messy, or panicked task descriptions into hyper-structured step-by-step survival timelines.
* **Autonomous Agent Execution:** Click "Do it for me" steps to let Gemini draft emails, perform web research summaries, or design time-blocks automatically.
* Calculates dynamic urgency ratings and priority indicators.

### 2. Proactive Guardian Engine
* **Mode A (Harvest):** Scans unread inbox streams (via Gmail API proxy) to find hidden or implicit payment dates and contract deadlines.
* **Mode B (Block & Buffer):** Pulls live calendar entries (via Google Calendar API proxy) and schedules defensive focus blocks.
* **Mode C (Escalate):** Automatically detects imminent project submission failures (under 60 mins remaining) and generates high-energy emergency voice call scripts (using browser Text-to-Speech simulation).

---

## 🛠️ Technology Stack
* **Frontend:** React, TypeScript, Vite, Tailwind CSS v4, Motion (Framer Motion), Lucide React
* **Backend:** Node.js, Express, TSX, `@google/genai` (Gemini API Client)
* **Auth & DB:** Firebase Authentication (Google Sign-In, Email/Password), Cloud Firestore (user state preservation)
* **API Integrations:** Google Gmail API, Google Calendar API

---

## ⚙️ Project Setup Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to a new file named `.env` (which is excluded from Git tracking):
```bash
cp .env.example .env
```
Fill in the following variables:
* `GEMINI_API_KEY`: Your Gemini API access key (obtain from Google AI Studio).
* `VITE_FIREBASE_*`: Your Firebase Web App config credentials.

### 3. Firebase Console Configuration
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create/select your project.
2. Under **Authentication**:
   * Initialize Authentication.
   * Enable the **Email/Password** provider.
   * Enable the **Google** provider.
3. Under **Firestore Database**:
   * Click **Create database** (leave database ID as `(default)`).
   * Choose start in **Test mode** (or configure custom security rules to allow read/write).

### 4. Enable Google Developer APIs (For Gmail & Calendar Pulls)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your Firebase-associated Google Cloud project.
3. Enable the **Gmail API** and the **Google Calendar API**.
4. Go to **OAuth Consent Screen**:
   * Set user type to **External** and fill in basic app details.
   * Under **Test Users**, add the Google email address you plan to sign in with (e.g. your email). *Crucial: If not added, Google will block the login because the app asks for sensitive read scopes.*

### 5. Running the Application
To start the backend proxy server and the Vite dev client:
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 🛡️ Security Best Practices
* Sensitive credentials and API keys have been moved into `.env` (which is excluded from Git tracking).
* Firebase JSON configuration files are ignored by Git. Always reference credentials via `import.meta.env` in client code and `process.env` in server code.

---

## ☁️ Vercel Deployment

This project is optimized to run as a single Vercel Serverless function proxying the Express backend, alongside the statically served Vite frontend.

### Steps to Deploy to Vercel:

1. **Install Vercel CLI (Optional):**
   ```bash
   npm i -g vercel
   ```
2. **Link and Deploy:**
   Run `vercel` from the root of the project to link your project and initiate a preview build:
   ```bash
   vercel
   ```
3. **Configure Environment Variables:**
   Add the following environment variables in your **Vercel Project Dashboard** (under Settings > Environment Variables):
   * `GEMINI_API_KEY`
   * `VITE_FIREBASE_API_KEY`
   * `VITE_FIREBASE_AUTH_DOMAIN`
   * `VITE_FIREBASE_PROJECT_ID`
   * `VITE_FIREBASE_STORAGE_BUCKET`
   * `VITE_FIREBASE_MESSAGING_SENDER_ID`
   * `VITE_FIREBASE_APP_ID`
   * `VITE_FIREBASE_MEASUREMENT_ID`
4. **Deploy to Production:**
   Run `vercel --prod` to deploy to production:
   ```bash
   vercel --prod
   ```
