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

### Option A: Render.com (Recommended — supports WebSockets)

**Deploy Backend:**
1. Create account at [render.com](https://render.com)
2. New → Web Service → Connect your repo
3. Root directory: `server`
4. Build: `npm install`
5. Start: `node index.js`
6. Copy the URL (e.g. `https://skribbl-server.onrender.com`)

**Deploy Frontend:**
1. New → Static Site → Same repo
2. Root directory: `client`
3. Build: `npm install && npm run build`
4. Publish directory: `build`
5. Add env variable: `REACT_APP_SERVER_URL=https://your-server-url.onrender.com`

### Option B: Railway
Same setup, even simpler. Railway auto-detects Node.js.

### ⚠️ Vercel / Netlify Note
These platforms use serverless functions and **do not support persistent WebSocket connections**. Use them only for the frontend; host the backend on Render or Railway.

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
