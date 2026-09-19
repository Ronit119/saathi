# SAATHI — Intelligent Digital Companion for Senior Citizens

> **"Your Everyday Digital Companion"**  
> *A patient, accessible, trustworthy GenAI-powered web companion built for senior citizens to navigate digital life with ease, confidence, and independence.*

---

## 1. Product Overview

Most modern digital interfaces assume technical confidence and digital agility. As a result, older adults often experience confusion, anxiety, and vulnerability when confronting everyday digital hurdles—from cryptic SMS alerts and OTPs to online bill payments and password resets.

**SAATHI** was designed from the ground up as a patient digital helper sitting beside the senior citizen. Rather than being a generic chat window, Saathi operates on a cohesive product philosophy:

$$\text{UNDERSTAND} \longrightarrow \text{SIMPLIFY} \longrightarrow \text{GUIDE} \longrightarrow \text{CONFIRM} \longrightarrow \text{REMEMBER} \longrightarrow \text{PROACTIVELY ASSIST}$$

---

## 2. Core Pillars & Capabilities

### A. Help Me Understand (Concept & Message Simplification)
- **Real Server-side GenAI**: Accepts confusing messages, terminology, or bill excerpts and transforms them into plain-language explanations using Google Gemini.
- **Structured Response Architecture**:
  1. **What This Means**: 2–3 plain-language sentences using everyday analogies.
  2. **Why This Matters**: Practical context for why the user needs to know this.
  3. **What You Can Do**: Actionable, sequential steps.
  4. **Be Careful About**: Essential security cautions (e.g., never sharing an OTP over phone calls).
  5. **Direct Task Hand-off**: A 1-click button (*"Help me do this step-by-step"*) seamlessly generates an interactive guide.
  6. **Audio Reading**: Optional Web Speech API text-to-speech reader for listening aloud.

### B. Do It With Me (Interactive Task Guidance)
- **Step-by-Step Breakdown**: Gemini structures any goal (e.g., *"How to change my Gmail password"*) into 3–7 manageable, physical steps.
- **Real Persistence**: Each step completed is saved immediately to persistent storage. Progress survives page reloads.
- **Contextual In-Guide Help**: If the user gets stuck on a step, clicking *"I can't find it"* or *"Explain this step"* sends the active step context to Gemini without resetting the guide or sending unnecessary conversation bloat.

### C. Reminders System (Deterministic NLP + Verification)
- **Natural Language Input**: Users can type natural phrases like *"Remind me tomorrow at 7 PM to pay electricity bill"*.
- **Deterministic Date Parsing**: Utilizes `chrono-node` to extract dates and times locally without wasting costly AI model requests.
- **Preview & Confirmation**: Displays interpreted title and time before writing to database, with optional manual date/time picker.
- **CRUD Operations**: View upcoming and completed reminders, toggle completion, and delete with confirmation dialogs.

### D. My Day (Connected Real-State Dashboard)
- Connects upcoming reminders, active guided tasks, and recent activity into one personalized dashboard.
- **Proactive AI Assistance**: When genuine tasks exist (e.g. bill due tomorrow + unfinished guide), Gemini generates one concise, helpful suggestion based strictly on real state.
- **Thoughtful Empty State**: When brand-new or with no pending tasks, presents an encouraging, uncluttered empty state without fabricated data.

### E. Senior Accessibility & Usability First
- **Baseline Typography**: 18px body baseline with comfortable line-height.
- **Instant Text Size Scaling**: Normal (18px), Large (21px), Extra Large (24px).
- **High Contrast Mode**: WCAG AAA compliant styling with high-contrast borders and deep contrast palettes.
- **Reduced Motion**: Disables all animations and transitions for sensitive users.
- **Touch-Friendly**: All interactive buttons, inputs, and links have minimum 48px touch targets.
- **Semantic Landmarks & Focus Indicators**: High-visibility focus rings and skip-to-content links for keyboard accessibility.

---

## 3. Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 + Custom Senior Accessibility Tokens
- **AI Orchestration**: Official Google GenAI SDK (`@google/genai`)
- **Schema Validation**: Zod runtime schema validation
- **Natural Language Date Parsing**: `chrono-node` (deterministic date/time extraction)
- **Persistence & Auth**:
  - Firebase Anonymous Authentication + Cloud Firestore
  - Resilient local persistence mirror (`localStorage`) for zero-friction evaluation
- **Icons**: Lucide React
- **Testing**: Vitest (17 passing unit & integration tests)

---

## 4. Architecture & Security Controls

```
                                  [Senior Citizen User]
                                            │
                                            ▼
                           [Accessible Next.js Interface]
                               (Tailwind + High Contrast)
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
          [Deterministic Utilities]                       [Server API Routes]
         • chrono-node date parsing                     /api/assistant/explain
         • Accessibility preferences                    /api/assistant/guide
         • Local persistence bridge                     /api/assistant/context-help
                                                        /api/assistant/proactive
                                                                   │
                                                ┌──────────────────┴──────────────────┐
                                                ▼                                     ▼
                                      [Rate Limiting & Zod]              [Google GenAI Server]
                                    Sliding window per client           GEMINI_API_KEY (Hidden)
                                                │                                     │
                                                ▼                                     ▼
                                      [Firestore Security]                 [Structured Output]
                                      request.auth.uid == id              JSON Schema Validation
```

### Security Controls Implemented:
1. **Zero Secret Exposure**: `GEMINI_API_KEY` is strictly confined to server-side route handlers. Never shipped in client bundles.
2. **Prompt-Injection Defense**: User inputs are isolated within `<USER_INPUT>` delimiters. System instructions enforce that input text is treated strictly as reference data, forbidding execution of embedded directives.
3. **Anti-Hallucination Boundaries**: Gemini is explicitly instructed never to claim it executed actions on external systems (e.g., "I changed your password" is prohibited).
4. **Firestore Security Rules**: User data is isolated by authenticated UID: `allow read, write: if request.auth != null && request.auth.uid == userId;`.
5. **Rate Limiting**: Sliding window rate limiting on all `/api/assistant/*` endpoints to protect against abuse.
6. **Input & Output Validation**: Every incoming payload and outgoing AI response is strictly validated against Zod schemas.

---

## 5. Local Setup & Configuration

### Prerequisites
- Node.js 20+ (tested on Node v24.20.0)
- npm 10+

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   GEMINI_MODEL=gemini-2.5-flash
   ```

   *(Optional) Firebase Cloud Credentials:*
   If connecting to your Firebase Cloud project, provide:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
   NEXT_PUBLIC_USE_LOCAL_PERSISTENCE=false
   ```
   *Note: If Firebase credentials are not provided, Saathi automatically operates using its built-in local persistence bridge, so all guides, reminders, and settings still persist across reloads.*

---

## 6. Running the Application

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Run
```bash
npm run build
npm run start
```

---

## 7. Automated Testing

Run the Vitest test suite:
```bash
npm run test
```
**Test Coverage Includes:**
- Deterministic natural language date parsing with `chrono-node` (`parseReminder.test.ts`)
- AI structured response schema validation & JSON extraction (`schemas.test.ts`)
- Guide step progression, bounds checking, and completion status logic (`guideProgress.test.ts`)
- Senior accessibility preference state management (`accessibility.test.ts`)
- API Route input validation & deterministic proactive logic (`routes.test.ts`)

---

## 8. Evaluator / Demo Walkthrough Script

Follow this sequence to evaluate the complete end-to-end user experience:

1. **First Visit**:
   - Open `http://localhost:3000`.
   - Observe the warm greeting, clear purpose, and clean empty state in **My Day** (*"Nothing you need to remember today"*).

2. **Test Accessibility Toggles**:
   - In the top header, click **Text: Normal** to cycle font size to **Large** (21px) and **Extra Large** (24px).
   - Click **Contrast** to toggle high contrast mode. Notice all borders and text remain sharp and legible.

3. **Feature A: Help Me Understand**:
   - Click **Ask Saathi** in the navigation bar.
   - Click the prompt chip *"What does Two-Factor Authentication mean?"* or type your own question.
   - Click **Explain Simply**.
   - Review the structured cards: *What This Means*, *Why This Matters*, *What You Can Do*, and *Be Careful About*.
   - Click **Help me do this step-by-step** to automatically transition into creating an interactive guide!

4. **Feature B: Do It With Me (Guided Tasks)**:
   - On the Guides page, click **Create Guide** for *"How to change my Gmail password"* (or type any digital goal).
   - Work through Step 1. Click **Done, Next Step**.
   - **Reload the browser page** (F5). Notice that Step 2 remains active and completed progress persisted.
   - Click **Explain this step** or **I can't find it** to trigger contextual assistance.

5. **Feature C: Reminders**:
   - Navigate to **Reminders**.
   - Type: *"Remind me tomorrow at 7 PM to pay electricity bill"*.
   - Notice the green preview box: *Scheduled for: Tomorrow at 7:00 PM* (parsed deterministically).
   - Click **Save Reminder**.
   - **Reload the page** (F5) to verify the reminder persisted.

6. **Connected Dashboard**:
   - Return to **Home**.
   - Observe that **My Day** now dynamically displays both the active guided task and the upcoming reminder.
   - If configured with Gemini, observe the proactive suggestion card tailored to your real stored state.

---

## 9. Known Limitations & Scope Control

- **External Account Actions**: By design, Saathi guides users step-by-step through interfaces rather than taking autonomous actions on external bank or email accounts. This is a deliberate safety and anti-hallucination constraint.
- **Push Notifications**: Relies on persisted in-app reminder views. OS-level push notifications require device service worker registration and push server infrastructure.
- **Voice Synthesis**: Uses the standard Web Speech API (`window.speechSynthesis`). The voice control button dynamically detects browser support and hides itself if unavailable.
