// Room.js - Manages a single game room
// Think of it as a "lobby" that contains players and hosts a Game

const { v4: uuidv4 } = require('uuid');
const Game = require('./Game');

class Room {
  constructor(hostId, hostName, settings, io) {
    this.id = uuidv4().slice(0, 6).toUpperCase(); // e.g. "A3B9F2"
    this.io = io;

    // Default settings, overridable by host
    this.settings = {
      maxPlayers: settings.maxPlayers || 8,
      rounds: settings.rounds || 3,
      drawTime: settings.drawTime || 80,
      wordCount: settings.wordCount || 3,
      hints: settings.hints !== undefined ? settings.hints : 2,
      isPrivate: settings.isPrivate || false,
      customWords: settings.customWords || ''
    };

    // Player list: [{ id, name, isHost, score, avatarId, spectator }]
    this.players = [{
      id: hostId,
      name: hostName,
      isHost: true,
      score: 0,
      avatarId: settings.hostAvatarId || 0,
      spectator: false
    }];

    this.hostId = hostId;
    this.game = null;          // No game yet (starts in lobby)
    this.status = 'lobby';     // 'lobby' | 'playing' | 'finished'
    this.drawingData = [];     // Stores current canvas strokes for late joiners
    this.drawingReplay = [];   // Store strokes with timestamps for replay
  }

  // ─── Add a player to the room ─────────────────────────────────────
  addPlayer(playerId, playerName, avatarId = 0) {
    if (this.players.length >= this.settings.maxPlayers) {
      return { success: false, reason: 'Room is full' };
    }
    if (this.status === 'playing') {
      return { success: false, reason: 'Game already in progress' };
    }
    if (this.players.find(p => p.id === playerId)) {
      return { success: false, reason: 'Already in room' };
    }

    this.players.push({
      id: playerId,
      name: playerName,
      isHost: false,
      score: 0,
      avatarId,
      spectator: false
    });
    return { success: true };
  }

  // ─── Remove a player (on disconnect) ──────────────────────────────
  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    this.players.forEach(p => p.score = 0); // Reset scores for fairness

    // If host left, assign a new host
    if (playerId === this.hostId && this.players.length > 0) {
      this.hostId = this.players[0].id;
      this.players[0].isHost = true;
      return { newHost: this.players[0] };
    }

    return { newHost: null };
  }

  // ─── Start the game (host only) ───────────────────────────────────
  startGame() {
    if (this.players.length < 2) return { success: false, reason: 'Need at least 2 players' };
    if (this.status === 'playing') return { success: false, reason: 'Already playing' };

    this.status = 'playing';
    this.drawingData = []; // Clear canvas for new game

    // Create a new Game instance and start it
    this.game = new Game(this.settings, this.players, this.io, this.id);
    this.game.start();

    return { success: true };
  }

  // ─── Handle a drawing stroke ──────────────────────────────────────
  addStroke(strokeData) {
    this.drawingData.push(strokeData);
  }

  clearCanvas() {
    this.drawingData = [];
  }

  undoLastStroke() {
    // Remove all strokes that belong to the last stroke group
    if (this.drawingData.length === 0) return;

    // Find the last draw_end marker and remove from there
    let i = this.drawingData.length - 1;
    while (i >= 0 && this.drawingData[i].type !== 'start') {
      i--;
    }
    this.drawingData = this.drawingData.slice(0, i);
  }

  // ─── Getters ──────────────────────────────────────────────────────
  getPublicInfo() {
    return {
      id: this.id,
      playerCount: this.players.length,
      maxPlayers: this.settings.maxPlayers,
      status: this.status,
      isPrivate: this.settings.isPrivate
    };
  }

  isEmpty() {
    return this.players.length === 0;
  }
}

module.exports = Room;
