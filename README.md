# 🎯 AI Sales Co-Pilot for Live Meetings

Real-time AI assistant that listens to your sales meetings and coaches you using the **SPIN Selling** methodology (Neil Rackham). It captures audio from both your microphone and the client's audio, transcribes the conversation live, and provides actionable coaching suggestions in real-time.

---

## ✨ Features

- **🎙️ Live Audio Transcription** — Captures both your microphone and system/screen audio via Gemini's native audio model
- **👥 Speaker Separation** — Distinguishes between "You (Seller)" and "Client" for accurate coaching
- **🧠 SPIN Selling AI Coach** — Analyzes the conversation in real-time and suggests questions based on the 4 SPIN phases:
  - **S**ituation → Understand the prospect's context
  - **P**roblem → Identify pain points
  - **I**mplication → Amplify the impact of problems
  - **N**eed-Payoff → Help the prospect visualize the solution
- **📊 Live Dashboard** — Visual progress tracking across all SPIN phases
- **📝 Meeting History** — Browse and review past meetings with full transcripts
- **🎮 Demo Mode** — Simulated conversation for testing without live audio

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 6, React Router 7 |
| **Backend** | Node.js, Express, Socket.IO |
| **AI** | Google Gemini API (2.0 Flash + Native Audio) |
| **Database** | SQLite (better-sqlite3) |
| **Real-time** | WebSockets (Socket.IO + native WS) |

---

## 📁 Project Structure

```
├── backend/
│   ├── server.js              # Express + Socket.IO server
│   ├── db.js                  # SQLite database setup
│   ├── routes/
│   │   └── meetings.js        # REST API for meetings
│   └── services/
│       ├── geminiLive.js       # Gemini Live Audio WebSocket session
│       ├── meetBot.js          # Demo mode conversation simulator
│       └── spinAgent.js        # SPIN Selling AI analysis engine
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx             # Router & layout
│       ├── main.jsx            # Entry point
│       ├── index.css           # Global styles
│       ├── components/
│       │   ├── Sidebar.jsx     # Navigation sidebar
│       │   ├── SpinPanel.jsx   # SPIN coaching panel
│       │   └── TranscriptView.jsx  # Live transcript display
│       ├── pages/
│       │   ├── Dashboard.jsx   # Home dashboard
│       │   ├── MeetingSetup.jsx # New meeting configuration
│       │   ├── MeetingView.jsx  # Active meeting view
│       │   └── History.jsx     # Past meetings browser
│       └── services/
│           ├── api.js          # REST API client
│           ├── audioCapture.js # Browser audio capture
│           └── socket.js       # Socket.IO client
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- A **Google Gemini API Key** ([Get one here](https://aistudio.google.com/apikey))

### 1. Clone the repository

```bash
git clone https://github.com/anandformation/AI-Sales-Co-Pilot-for-Live-Meetings.git
cd AI-Sales-Co-Pilot-for-Live-Meetings
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
GEMINI_MODEL=gemini-2.5-flash-native-audio-latest
```

Start the backend:

```bash
npm run dev
```

### 3. Set up the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 🎮 Usage

1. Open the app at `http://localhost:5173`
2. Click **New Meeting** from the sidebar
3. Choose a mode:
   - **Live Audio** — Uses your microphone + screen audio for real-time transcription
   - **Demo Mode** — Runs a simulated sales conversation
4. Watch the **SPIN Panel** on the right for AI-powered coaching suggestions
5. Follow the suggested questions to guide your sales conversation

---

## 🔒 Security

- API keys are stored in `.env` files (git-ignored)
- No secrets are hardcoded in the source code
- All sensitive files are excluded via `.gitignore`

---

## 📄 License

MIT
