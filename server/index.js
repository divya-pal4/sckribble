// index.js - The main server file
// This sets up:
//   1. Express (HTTP server - serves API endpoints)
//   2. Socket.IO (WebSocket server - real-time events)

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Room = require('./Room');

const app = express();
const server = http.createServer(app); // Wrap express in http server

// ─── Socket.IO Setup ──────────────────────────────────────────────────
// Socket.IO needs the http server (not express directly)
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow all origins in development, specific ones in production
      if (process.env.NODE_ENV === 'production') {
        const allowed = [
          'https://sckribble-client.onrender.com',
          'https://sckribble-server.onrender.com',
          'https://sckribble.onrender.com',
          'http://localhost:3000',
          'http://localhost:3001'
        ];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowed.some(a => origin.includes(a) || a.includes(origin))) {
          callback(null, true);
        } else {
          console.warn('CORS blocked request from:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        // In development, allow all
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingInterval: 10000,
  pingTimeout: 5000
});

app.use(cors());
app.use(express.json());

// ─── In-memory room storage ───────────────────────────────────────────
// rooms = { roomId: Room }
// In a real app you'd use a database, but for this assignment memory is fine
const rooms = {};

// ─── HTTP Endpoints ───────────────────────────────────────────────────

// GET /rooms - List all public rooms (for "join a random room" feature)
app.get('/rooms', (req, res) => {
  const publicRooms = Object.values(rooms)
    .filter(r => !r.settings.isPrivate && r.status === 'lobby')
    .map(r => r.getPublicInfo());
  res.json(publicRooms);
});

// GET /rooms/:id - Check if a specific room exists
app.get('/rooms/:id', (req, res) => {
  const room = rooms[req.params.id.toUpperCase()];
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room.getPublicInfo());
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Socket.IO Event Handlers ─────────────────────────────────────────
// Each "socket" represents one connected player/browser tab

io.on('connection', (socket) => {
  console.log(`🔌 Player connected: ${socket.id}`);
  console.log(`   Headers:`, { origin: socket.request.headers.origin });

  // ── CREATE ROOM ────────────────────────────────────────────────────
  // Client sends: { playerName, settings, avatarId }
  socket.on('create_room', ({ playerName, settings = {}, avatarId }) => {
    console.log(`📝 create_room event received from ${socket.id}: ${playerName}`);
    const room = new Room(socket.id, playerName, { ...settings, hostAvatarId: avatarId }, io);
    rooms[room.id] = room;

    socket.join(room.id); // Subscribe to room's broadcast channel

    console.log(`🏠 Room created: ${room.id} by ${playerName}`);

    socket.emit('room_created', {
      roomId: room.id,
      players: room.players,
      settings: room.settings,
      playerId: socket.id
    });
  });

  // ── JOIN ROOM ──────────────────────────────────────────────────────
  // Client sends: { roomId, playerName, avatarId }
  socket.on('join_room', ({ roomId, playerName, avatarId }) => {
    const room = rooms[roomId?.toUpperCase()];

    if (!room) {
      return socket.emit('error', { message: 'Room not found' });
    }

    const result = room.addPlayer(socket.id, playerName, avatarId);
    if (!result.success) {
      return socket.emit('error', { message: result.reason });
    }

    socket.join(room.id);
    console.log(`👤 ${playerName} joined room ${room.id}`);

    // Send the current room state to the new player
    socket.emit('room_joined', {
      roomId: room.id,
      players: room.players,
      settings: room.settings,
      playerId: socket.id,
      drawingData: room.drawingData // So late joiners see current canvas
    });

    // Tell everyone else in the room
    socket.to(room.id).emit('player_joined', {
      player: room.players.find(p => p.id === socket.id),
      players: room.players
    });
  });

  // ── START GAME ─────────────────────────────────────────────────────
  socket.on('start_game', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('error', { message: 'Room not found' });
    if (room.hostId !== socket.id) return socket.emit('error', { message: 'Only the host can start' });

    const result = room.startGame();
    if (!result.success) {
      return socket.emit('error', { message: result.reason });
    }

    console.log(`🎮 Game started in room ${roomId}`);
  });

  // ── WORD CHOSEN ────────────────────────────────────────────────────
  socket.on('word_chosen', ({ roomId, word }) => {
    const room = rooms[roomId];
    if (!room || !room.game) return;

    // Verify the socket is the current drawer
    if (room.game.getCurrentDrawer().id !== socket.id) return;

    room.game.wordChosen(word);
  });

  // ── DRAWING EVENTS ─────────────────────────────────────────────────
  // These three events form a "stroke": start → move(s) → end

  socket.on('draw_start', ({ roomId, x, y, color, size, tool }) => {
    const room = rooms[roomId];
    if (!room) return;

    const strokeData = { type: 'start', x, y, color, size, tool };
    room.addStroke(strokeData);

    // Broadcast to everyone else (not the drawer)
    socket.to(roomId).emit('draw_data', strokeData);
  });

  socket.on('draw_move', ({ roomId, x, y }) => {
    const room = rooms[roomId];
    if (!room) return;

    const strokeData = { type: 'move', x, y };
    room.addStroke(strokeData);
    socket.to(roomId).emit('draw_data', strokeData);
  });

  socket.on('draw_end', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const strokeData = { type: 'end' };
    room.addStroke(strokeData);
    socket.to(roomId).emit('draw_data', strokeData);
  });

  socket.on('canvas_clear', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.clearCanvas();
    socket.to(roomId).emit('canvas_cleared');
  });

  socket.on('draw_undo', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.undoLastStroke();
    // Tell all clients to re-render the drawing data
    io.to(roomId).emit('canvas_replay', { drawingData: room.drawingData });
  });

  // ── GUESSING ───────────────────────────────────────────────────────
  socket.on('guess', ({ roomId, text }) => {
    const room = rooms[roomId];
    if (!room || !room.game) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const result = room.game.handleGuess(socket.id, text);

    if (result.alreadyGuessed) return;

    if (result.correct) {
      // Tell everyone someone guessed correctly
      io.to(roomId).emit('guess_result', {
        correct: true,
        playerId: socket.id,
        playerName: player.name,
        points: result.points,
        scores: room.game.getScores()
      });
    } else {
      // Show the wrong guess as a chat message (to everyone)
      io.to(roomId).emit('chat_message', {
        type: 'guess',
        playerId: socket.id,
        playerName: player.name,
        text,
        correct: false
      });
    }
  });

  // ── CHAT ───────────────────────────────────────────────────────────
  socket.on('chat', ({ roomId, text }) => {
    const room = rooms[roomId];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    io.to(roomId).emit('chat_message', {
      type: 'chat',
      playerId: socket.id,
      playerName: player.name,
      text
    });
  });

  // ── DISCONNECT ─────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`❌ Player disconnected: ${socket.id}`);

    // Find which room this player was in
    for (const [roomId, room] of Object.entries(rooms)) {
      const wasInRoom = room.players.find(p => p.id === socket.id);
      if (!wasInRoom) continue;

      const { newHost } = room.removePlayer(socket.id);

      if (room.isEmpty()) {
        // Clean up game timers and delete empty rooms
        if (room.game) room.game.cleanup();
        delete rooms[roomId];
        console.log(`🗑️  Room ${roomId} deleted (empty)`);
      } else {
        // Tell remaining players someone left
        io.to(roomId).emit('player_left', {
          playerId: socket.id,
          players: room.players,
          newHost: newHost ? newHost.id : null
        });
      }
      break;
    }
  });
});

// ─── Start Server ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
});
