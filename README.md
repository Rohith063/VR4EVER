# 4EVER 💛 (VR4EVER)

> A modern, self-hosted, full-stack relationship companion web app for couples, best friends, and siblings. Built independently with React 19, TypeScript, Tailwind CSS v4, Recharts, and Supabase.

---

## ✨ Features

### 1. 💬 Real-Time 1-on-1 Chat
- Instant bidirectional messaging over Supabase Realtime WebSocket channels.
- Support for text messages, uploaded pictures (with full-screen lightbox preview), and GPS location pin drop cards.
- Read receipts, timestamps, and message bubbles styled with glassmorphism.

### 2. 🟢 Live User Presence & Distance Calculator
- Live online/offline status indicators with green pulse animation.
- Geolocation sharing using the browser Geolocation API.
- Live distance calculation between partners using the **Haversine formula** (e.g. `2.4 km away`).
- Device battery level indicators.

### 3. 👥 Partner Pairing & Request System
- **Pair Codes:** Instant connection via unique 6-character uppercase codes (e.g., `7X9K2P`).
- **Username Invites:** Send connection requests directly to partner's `@username`.
- **Requests Hub:** Accept or decline incoming pairing requests in real-time.
- Multi-mode relationship support: **Couple**, **Best Friends**, and **Siblings**.

### 4. 📸 In-App Viewfinder Camera & Filters
- Native camera viewfinder with front / back camera toggle.
- Real-time photo filter presets:
  - **Original**
  - **Warm Glow** (golden hour aesthetic)
  - **Vintage Film** (sepia nostalgic tone)
  - **Noir** (high-contrast black & white)
- Instant snapshot capture with local download and direct sharing to chat or memory journal.

### 5. 🗓️ Shared Calendar & Milestones
- Interactive monthly calendar with quick navigation.
- Color-coded event markers:
  - 🌹 **Date** (Romantic dinners, cafe visits)
  - 📚 **College / Exam** (Submission deadlines, tests)
  - ✨ **Special** (Anniversaries, birthdays, milestones)
- Upcoming milestones countdown widget.

### 6. 🎓 Study Planner & Co-Focus Timer
- Shared study task lists organized into **Today**, **Tomorrow**, and **This Week**.
- Task delegation: Assigned to *You*, *Partner*, or *Both*.
- Real-time task completion rate tracking and motivational streak indicators.
- Built-in **25-minute Pomodoro Sprint timer** with sound and celebratory confetti.

### 7. 💰 Shared Budget & Fair Expense Splitter
- Monthly spending limit tracker with warning thresholds (Green → Amber → Red).
- **"Who Paid More?" Net Settlement Calculator:** Computes fair 50/50 balance (e.g., *"Partner owes you ₹450"*) with a 1-click **"Settle Up"** action.
- Interactive **Recharts Visualizations**:
  - Donut chart showing category breakdown (Food, Chai, Travel, Fun, Groceries, Books, Trips).
  - 7-day spending trend bar chart.
- Expense log with category filtering and currency formatting in INR (₹).

### 8. 🖼️ Memories Journal & Dream Trip Bucket List
- Photo journal with tags (`date`, `trip`, `milestone`, `funny`), story descriptions, and location tags.
- Full-screen lightbox zoom view for captured moments.
- **Dream Goals:** Visual savings tracker for vacations or anniversary gifts with quick-deposit shortcuts (+₹500, +₹1,000).

### 9. 📝 Pastel Sticky Love Notes
- Digital corkboard with pastel notes in 4 color themes: *Warm Gold*, *Soft Rose*, *Pastel Sky*, and *Fresh Mint*.
- Author attribution, creation timestamps, and priority pin-to-top functionality.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4
- **Styling:** Custom Glassmorphism, Playfair Display serif headings, Inter typography
- **Animations & Effects:** Framer Motion, Canvas Confetti
- **Charts:** Recharts (Responsive Pie & Bar charts)
- **Icons:** Lucide React
- **Backend & Database:** Supabase (PostgreSQL with Row Level Security, Realtime channels, Storage)
- **Offline / Zero-Config Fallback:** Synchronous local storage caching for immediate testing without backend dependencies.

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-username/vr4ever.git
cd vr4ever
npm install
```

### 2. Configure Environment Variables (Optional for Cloud Mode)

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Note:** Even without Supabase credentials, the app runs in **Demo / Zero-Config Mode** immediately with full functionality, storing all data in your browser's local storage.

### 3. Database Migration (For Supabase Cloud)

If you are using Supabase:
1. Go to your Supabase Project Dashboard -> **SQL Editor**.
2. Copy and execute the complete script located in `supabase-schema.sql`.
3. This creates all tables (`profiles`, `relationships`, `relationship_requests`, `messages`, `user_locations`, `memories`, `expenses`, `milestones`, `goals`, `study_tasks`, `calendar_events`, `sticky_notes`) with Row Level Security (RLS) policies and Realtime replication.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production

```bash
npm run build
npm run preview
```

---

## 📦 Deployment to GitHub & Vercel / Netlify

### Deploying to GitHub:
```bash
git init
git add .
git commit -m "feat: complete 4EVER self-hosted relationship platform"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

### Deploying to Vercel:
1. Import your GitHub repository on [Vercel](https://vercel.com).
2. Framework preset will automatically detect **Vite**.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Environment Variables.
4. Click **Deploy**!

---

## 🔒 Privacy & Security

- Row Level Security (RLS) guarantees that only paired partners can view and mutate their shared relationship records.
- Location coordinates are only transmitted and visible when both partners explicitly toggle on location sharing.
