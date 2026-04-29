// Game.js - Manages a single game session (rounds, scoring, turns)
// This uses OOP (Object-Oriented Programming) - the game is a "class" (blueprint)
// Each room creates one Game instance

const { getRandomWords } = require('./words');

class Game {
  constructor(settings, players, io, roomId) {
    // io = Socket.IO server (used to broadcast messages to players)
    // roomId = which room this game belongs to
    this.io = io;
    this.roomId = roomId;

    // Settings from the host (rounds, draw time, word count)
    this.totalRounds = settings.rounds || 3;
    this.drawTime = settings.drawTime || 80;
    this.wordCount = settings.wordCount || 3;
    this.hintsEnabled = settings.hints !== 0;
    this.maxHints = settings.hints || 2;

    // Player list: [{ id, name, score, hasGuessed }]
    this.players = players.map(p => ({ ...p, score: 0, hasGuessed: false }));

    // Game state tracking
    this.currentRound = 0;
    this.currentDrawerIndex = 0;
    this.currentWord = null;
    this.wordHint = null;         // e.g. "_ _ _ _ _"
    this.revealedIndices = new Set(); // which letters have been revealed
    this.phase = 'waiting';       // 'waiting' | 'choosing' | 'drawing' | 'roundEnd' | 'gameOver'

    // Timers (stored so we can clear them)
    this.roundTimer = null;
    this.hintTimer = null;
    this.countdownValue = 0;
    this.countdownInterval = null;
  }

  // ─── Start the entire game ─────────────────────────────────────────
  start() {
    this.currentRound = 1;
    this.currentDrawerIndex = 0;
    this.startRound();
  }

  // ─── Start a single round ──────────────────────────────────────────
  startRound() {
    // Reset "has guessed" for all players
    this.players.forEach(p => p.hasGuessed = false);

    const drawer = this.getCurrentDrawer();
    const wordOptions = getRandomWords(this.wordCount);

    this.phase = 'choosing';

    // Tell EVERYONE a new round is starting
    this.broadcast('round_start', {
      round: this.currentRound,
      totalRounds: this.totalRounds,
      drawerId: drawer.id,
      drawerName: drawer.name,
      wordOptions: null,   // Others don't see the word choices
      drawTime: this.drawTime
    });

    // Tell ONLY the drawer the word choices (private message)
    this.io.to(drawer.id).emit('round_start', {
      round: this.currentRound,
      totalRounds: this.totalRounds,
      drawerId: drawer.id,
      drawerName: drawer.name,
      wordOptions,          // Only the drawer sees this
      drawTime: this.drawTime
    });

    // If drawer doesn't choose in 15 seconds, auto-pick
    this.roundTimer = setTimeout(() => {
      if (this.phase === 'choosing') {
        this.wordChosen(wordOptions[0]);
      }
    }, 15000);
  }

  // ─── Drawer picked a word ──────────────────────────────────────────
  wordChosen(word) {
    clearTimeout(this.roundTimer);
    this.currentWord = word.toLowerCase();
    this.wordHint = this.buildHint(word);
    this.revealedIndices = new Set();
    this.phase = 'drawing';

    // Tell everyone drawing has started (but NOT the word itself)
    this.broadcast('drawing_phase', {
      hint: this.wordHint,
      wordLength: word.length,
      drawTime: this.drawTime
    });

    // Start countdown timer
    this.countdownValue = this.drawTime;
    this.countdownInterval = setInterval(() => {
      this.countdownValue--;
      this.broadcast('timer_tick', { timeLeft: this.countdownValue });
      if (this.countdownValue <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);

    // Schedule the round to end when time runs out
    this.roundTimer = setTimeout(() => this.endRound(), this.drawTime * 1000);

    // Schedule hints to reveal over time
    if (this.hintsEnabled && this.maxHints > 0) {
      this.scheduleHints();
    }
  }

  // ─── Build the hint string: "_ _ _ _ _" ───────────────────────────
  buildHint(word) {
    return word
      .split('')
      .map(char => (char === ' ' ? ' ' : '_'))
      .join(' ');
  }

  // ─── Reveal a letter in the hint ──────────────────────────────────
  revealLetter() {
    const word = this.currentWord;
    // Find unrevealed letter positions (skip spaces)
    const unrevealed = word
      .split('')
      .map((char, i) => ({ char, i }))
      .filter(({ char, i }) => char !== ' ' && !this.revealedIndices.has(i));

    if (unrevealed.length === 0) return;

    // Pick a random unrevealed letter
    const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    this.revealedIndices.add(pick.i);

    // Rebuild hint with newly revealed letter
    this.wordHint = word
      .split('')
      .map((char, i) => {
        if (char === ' ') return ' ';
        return this.revealedIndices.has(i) ? char : '_';
      })
      .join(' ');

    this.broadcast('hint_update', { hint: this.wordHint });
  }

  // ─── Schedule hints to be revealed over time ──────────────────────
  scheduleHints() {
    const interval = (this.drawTime / (this.maxHints + 1)) * 1000;
    for (let i = 1; i <= this.maxHints; i++) {
      setTimeout(() => {
        if (this.phase === 'drawing') {
          this.revealLetter();
        }
      }, interval * i);
    }
  }

  // ─── Process a guess from a player ────────────────────────────────
  handleGuess(playerId, guessText) {
    if (this.phase !== 'drawing') return { correct: false, alreadyGuessed: false };

    const player = this.players.find(p => p.id === playerId);
    if (!player) return { correct: false };

    // Drawer can't guess their own word
    if (playerId === this.getCurrentDrawer().id) return { correct: false };
    if (player.hasGuessed) return { correct: false, alreadyGuessed: true };

    // Case-insensitive, trimmed comparison
    const correct = guessText.trim().toLowerCase() === this.currentWord;

    if (correct) {
      player.hasGuessed = true;

      // More points for guessing faster
      const timeBonus = Math.floor((this.countdownValue / this.drawTime) * 200);
      const points = 100 + timeBonus;
      player.score += points;

      // Also give the drawer points
      const drawer = this.getCurrentDrawer();
      if (drawer) {
        const drawerPlayer = this.players.find(p => p.id === drawer.id);
        if (drawerPlayer) drawerPlayer.score += 50;
      }

      // Check if ALL non-drawer players have guessed
      const nonDrawers = this.players.filter(p => p.id !== this.getCurrentDrawer().id);
      const allGuessed = nonDrawers.every(p => p.hasGuessed);
      if (allGuessed) {
        setTimeout(() => this.endRound(), 2000);
      }

      return { correct: true, points };
    }

    return { correct: false };
  }

  // ─── End the current round ────────────────────────────────────────
  endRound() {
    clearTimeout(this.roundTimer);
    clearInterval(this.countdownInterval);
    this.phase = 'roundEnd';

    this.broadcast('round_end', {
      word: this.currentWord,
      scores: this.getScores()
    });

    // Wait 4 seconds before starting next round
    setTimeout(() => this.nextRound(), 4000);
  }

  // ─── Move to next round or end the game ───────────────────────────
  nextRound() {
    this.currentDrawerIndex++;

    // If everyone has drawn in this round, increment the round
    if (this.currentDrawerIndex >= this.players.length) {
      this.currentDrawerIndex = 0;
      this.currentRound++;
    }

    // Check if game is over
    if (this.currentRound > this.totalRounds) {
      this.endGame();
      return;
    }

    this.startRound();
  }

  // ─── End the entire game ──────────────────────────────────────────
  endGame() {
    this.phase = 'gameOver';
    const sortedScores = this.getScores().sort((a, b) => b.score - a.score);
    const winner = sortedScores[0];

    this.broadcast('game_over', {
      winner,
      leaderboard: sortedScores
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────
  getCurrentDrawer() {
    return this.players[this.currentDrawerIndex];
  }

  getScores() {
    return this.players.map(p => ({ id: p.id, name: p.name, score: p.score }));
  }

  // Broadcast to everyone in the room
  broadcast(event, data) {
    this.io.to(this.roomId).emit(event, data);
  }

  cleanup() {
    clearTimeout(this.roundTimer);
    clearInterval(this.countdownInterval);
  }
}

module.exports = Game;
