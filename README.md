# 🎨 Skribbl Clone – Premium Multiplayer Drawing Game

A full-featured Skribbl.io-inspired drawing game with emoji avatars, custom words, sound effects, reactions, spectator mode, drawing replay, and votekick moderation.

---

## ✨ Premium Features at a Glance

| Feature | What It Does |
|---------|-------------|
| 🦁 **Emoji Avatars** | 8 unique avatars (Lion, Frog, Butterfly, Fox, Penguin, Raccoon, Duck, Lizard) instead of colors |
| 📝 **Custom Words** | Hosts input custom drawing prompts (comma/newline-separated) |
| 🔊 **Sound Effects** | Web Audio API: correct chime, round start, low-time tick |
| 🔥 **Reactions** | Click emojis (🔥😂👏❤️🎉⚡) that float on canvas |
| 👁️ **Spectator Mode** | Join mid-game to watch without affecting play |
| 🎬 **Drawing Replay** | After each round, watch drawing animate from scratch |
| 🚫 **Votekick** | Majority vote removes disruptive players |
| ✅ **Fair Scoring** | Scores reset on disconnect; rejoining starts fresh |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v16+ installed
- npm v7+

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd skribbl-clone

# Install all dependencies (root + server + client)
npm install
npm run install:all
```

### 2. Run in Development
```bash
# This starts BOTH server and client at the same time
npm run dev
```

- **Backend** runs at: `http://localhost:3001`
- **Frontend** runs at: `http://localhost:3000`

Open `http://localhost:3000` in two different browser tabs to test multiplayer!

---

## 📁 Project Structure

```
skribbl-clone/
├── server/                  # Node.js backend
│   ├── index.js             # Express + Socket.IO server
│   ├── Game.js              # Game logic (rounds, scoring, hints)
│   ├── Room.js              # Room management
│   ├── words.js             # Word bank
│   └── package.json
│
├── client/                  # React frontend
│   ├── src/
│   │   ├── App.js           # Root component (routing between screens)
│   │   ├── index.js         # React entry point
│   │   ├── styles.css       # All styles
│   │   ├── context/
│   │   │   └── SocketContext.js   # Shared socket connection
│   │   ├── hooks/
│   │   │   ├── useGame.js         # All game state & Socket.IO events
│   │   │   └── useCanvas.js       # Canvas drawing logic
│   │   ├── pages/
│   │   │   ├── Home.js            # Landing page
│   │   │   ├── Lobby.js           # Waiting room
│   │   │   └── GamePage.js        # Main game screen
│   │   └── components/
│   │       ├── Canvas.js          # Drawing canvas + toolbar
│   │       ├── Chat.js            # Chat / guessing panel
│   │       ├── Scoreboard.js      # Player scores
│   │       └── Overlays.js        # Round end + Game over screens
│   └── package.json
│
├── package.json             # Root (runs both with concurrently)
├── render.yaml              # Deployment config
└── README.md
```

---

## 🏗️ Architecture Overview

### How it all fits together

```
Browser (React)
    |
    |  HTTP (REST)      → GET /rooms (list public rooms)
    |  WebSocket (WS)   → Real-time: drawing, chat, game state
    ↓
Node.js Server (Express + Socket.IO)
    |
    ├── Room[]          → Manages rooms, players, settings
    └── Game            → Manages rounds, scoring, turn order
```

### WebSocket Flow (Real-time sync)

```
Drawer drags mouse
  → useCanvas captures mouse coords
  → emits draw_start / draw_move / draw_end to server
  → server broadcasts draw_data to all other players in room
  → other browsers' useCanvas replays the stroke on their canvas
```

### Game State Machine

```
home → lobby → choosing → drawing → roundEnd → (next round or gameOver)
```

---

## 🔌 WebSocket Events Reference

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `create_room` | `{ playerName, settings }` | Create a new room |
| `join_room` | `{ roomId, playerName }` | Join existing room |
| `start_game` | `{ roomId }` | Host starts the game |
| `word_chosen` | `{ roomId, word }` | Drawer picks a word |
| `draw_start` | `{ roomId, x, y, color, size, tool }` | Begin stroke |
| `draw_move` | `{ roomId, x, y }` | Continue stroke |
| `draw_end` | `{ roomId }` | End stroke |
| `canvas_clear` | `{ roomId }` | Clear canvas |
| `draw_undo` | `{ roomId }` | Undo last stroke |
| `guess` | `{ roomId, text }` | Player sends a guess |
| `chat` | `{ roomId, text }` | Player sends a chat message |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `room_created` | `{ roomId, players, settings }` | Room created confirmation |
| `room_joined` | `{ roomId, players, drawingData }` | Successfully joined |
| `player_joined` | `{ player, players }` | Someone joined |
| `player_left` | `{ playerId, players }` | Someone left |
| `round_start` | `{ round, drawerId, wordOptions?, drawTime }` | Round begins |
| `drawing_phase` | `{ hint, drawTime }` | Word chosen, drawing starts |
| `timer_tick` | `{ timeLeft }` | Every second countdown |
| `hint_update` | `{ hint }` | A letter was revealed |
| `draw_data` | `{ type, x, y, ... }` | Broadcast drawing stroke |
| `guess_result` | `{ correct, playerName, points }` | Guess result |
| `chat_message` | `{ playerName, text }` | Chat message |
| `round_end` | `{ word, scores }` | Round finished |
| `game_over` | `{ winner, leaderboard }` | Game finished |
| `canvas_cleared` | `{}` | Canvas was cleared |
| `canvas_replay` | `{ drawingData }` | Full canvas replay (after undo) |

---

## 🎯 Key Technical Decisions

### Why Socket.IO over raw WebSockets?
Socket.IO adds rooms (groups of connections), automatic reconnection, and event-based API on top of raw WebSockets. Broadcasting to a room is one line: `io.to(roomId).emit(...)`.

### How drawing sync works
Drawing is captured as coordinate deltas (not screenshots). Each mouse move emits `{x, y}` — tiny data packets. The server rebroadcasts them; other clients replay the strokes. Late joiners get the full `drawingData` array and replay it.

### Why store drawing data in memory?
For this assignment, SQLite/PostgreSQL would be overkill. In-memory storage is fast and simple. Data is lost when the server restarts — acceptable for a game session.

### Word matching
```js
guessText.trim().toLowerCase() === this.currentWord
```
Simple, case-insensitive, whitespace-trimmed equality. No fuzzy matching (by design — partial matches would make the game too easy).

### OOP Structure
- **`Room`**: Owns players, settings, and the current `Game` instance
- **`Game`**: Owns round logic, scoring, timer, hint system
- Clean separation: `Room` = lobby, `Game` = gameplay

---

## 🚢 Deployment Guide

### Current Deployment (Render.com - Two Separate Services)

The app is deployed on two separate Render services:

**Live URLs:**
- 🎮 **Frontend:** https://sckribble-client.onrender.com
- 🔌 **Backend:** https://sckribble-server.onrender.com

### How to Deploy Your Own

#### Prerequisites
- GitHub account with your repository pushed
- Render.com account

#### Step 1: Deploy Backend (Web Service)

1. Go to [render.com](https://render.com) and log in
2. Click **"+ New"** → **"Web Service"**
3. Connect your GitHub repository
4. Fill in:
   - **Name:** `sckribble-server` (or your preferred name)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
5. Click **"Create Web Service"**
6. Wait 3-5 minutes for deployment to complete (green ✅ status)
7. Copy the URL from the dashboard (e.g., `https://sckribble-server.onrender.com`)

#### Step 2: Deploy Frontend (Static Site)

1. Go back to Render dashboard
2. Click **"+ New"** → **"Static Site"**
3. Connect your GitHub repository (same repo)
4. Fill in:
   - **Name:** `sckribble-client` (or your preferred name)
   - **Branch:** `main`
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`
5. Add Environment Variable:
   - **Name:** `REACT_APP_SERVER_URL`
   - **Value:** `https://sckribble-server.onrender.com` (use your backend URL from Step 1)
6. Click **"Create Static Site"**
7. Wait 5-10 minutes for deployment to complete (green ✅ status)

#### Step 3: Test the Connection

1. Open your frontend URL: `https://sckribble-client.onrender.com`
2. Press **F12** → **Console** tab
3. You should see:
   ```
   ✅ Socket connected: [socket-id]
   ```
4. Try creating a room and verify socket logs appear in the console

### Why Separate Services?

- ✅ **Independent scaling** - Backend and frontend scale separately
- ✅ **WebSocket support** - Static site hosts can't handle persistent WebSockets
- ✅ **Cleaner architecture** - Backend focuses on logic, frontend on UI
- ✅ **Easy updates** - Deploy either service without affecting the other
- ✅ **Better performance** - Each service optimized for its purpose

### Auto-Deploy on GitHub Push

Once set up, both services will automatically redeploy when you push to `main` branch:

```bash
git add -A
git commit -m "Your changes"
git push origin main
```

Both services will rebuild and deploy within 5-10 minutes.

### Alternative: Render.yaml (Advanced)

For a true monorepo setup, use the included `render.yaml`:

```bash
git push origin main  # Will auto-detect render.yaml and create both services
```

This requires one-time setup but then manages both services as a unified deployment.

---

## 🔧 Troubleshooting

### "Not connected to server" error

**Problem:** The app shows "Connecting to server... please wait a moment and try again"

**Solutions:**
1. **Wait for server to deploy** - First deployment takes 5-10 minutes. Check Render dashboard for green ✅ status
2. **Check environment variable** - In Render dashboard → `sckribble-client` → Settings → Environment Variables
   - Verify `REACT_APP_SERVER_URL` is set to your backend URL (e.g., `https://sckribble-server.onrender.com`)
3. **Hard refresh browser** - Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) to clear cache
4. **Check browser console** - Press F12 → Console tab
   - Should show `✅ Socket connected: [socket-id]`
   - If not, check if the server URL is correct

### WebSocket errors in console

**Example error:**
```
WebSocket connection to 'wss://sckribble-client.onrender.com/socket.io/...' failed
```

**Problem:** The client is trying to connect to itself instead of the backend

**Solution:**
1. Go to Render dashboard → `sckribble-client` → Settings
2. Update `REACT_APP_SERVER_URL` to point to your backend server URL
3. Click Save (triggers redeploy)
4. Wait 3-5 minutes and refresh the browser

### Room creation fails silently

**Problem:** Click "Create Room" but nothing happens, no error shown

**Solutions:**
1. Check browser console (F12) for any error messages
2. Verify both services show green ✅ status in Render dashboard
3. Try a hard refresh: `Ctrl+Shift+R`
4. If still failing, check the backend logs:
   - Go to Render dashboard → `sckribble-server` → Logs
   - Should show: `🚀 Server running on port 3001`
   - Look for any error messages

### Can't join a room with a code

**Problem:** "Room not found" error even though the code is correct

**Solutions:**
1. Verify the 6-letter room code is exactly correct (uppercase)
2. Ask the host to check if anyone else is in the room (if empty, it may have been deleted)
3. Create a new room and share a fresh invite link instead

---

## 🎮 How to Play

1. Open the app → Enter your name → Create Room
2. Share the 6-letter room code with friends
3. Host clicks **Start Game** (needs 2+ players)
4. **Drawer**: Choose a word from the options, then draw it!
5. **Guessers**: Type guesses in the chat box — first correct guess gets bonus points
6. After all rounds, the player with the most points wins! 🏆

---

## ✅ Features Implemented

### Must Have ✅
- [x] Create room with configurable settings
- [x] Join room via code or invite link
- [x] Lobby with player list; host starts game
- [x] Turn-based rounds: one drawer, others guess
- [x] Real-time drawing sync (strokes visible to all)
- [x] Word selection (1–5 choices configurable)
- [x] Guessing with points for correct answer
- [x] Scoring and live leaderboard
- [x] Game end with winner announcement
- [x] Drawing tools: brush, colors, eraser, undo, clear

### Should Have ✅
- [x] Hints (reveal letters over time)
- [x] Chat (guesses + chat messages)
- [x] Draw time countdown
- [x] Private rooms (invite link)

### Bonus ✅
- [x] OOP structure (Room, Game, Player classes)
- [x] Host reassignment on disconnect
- [x] Late joiner canvas replay

---

## 🧑‍💻 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + CSS (no framework) |
| Canvas | HTML5 Canvas API (custom logic) |
| Backend | Node.js + Express |
| WebSockets | Socket.IO 4 |
| State | React hooks (useState, useEffect, useCallback) |
| Deployment | Render.com |
