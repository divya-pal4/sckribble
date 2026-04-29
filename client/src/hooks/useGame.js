// useGame.js - Custom hook that manages ALL game state
// A "hook" in React is a function that handles state and side effects.
// Putting all game logic here keeps components clean and focused on UI.

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

export function useGame() {
  const socket = useSocket();

  // ─── State Variables ────────────────────────────────────────────────
  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [settings, setSettings] = useState({});
  const [gamePhase, setGamePhase] = useState('home'); // home|lobby|choosing|drawing|roundEnd|gameOver
  const [currentDrawerId, setCurrentDrawerId] = useState(null);
  const [round, setRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [wordOptions, setWordOptions] = useState([]);  // Choices for the drawer
  const [hint, setHint] = useState('');                // "_ _ _ _ _" style hint
  const [timeLeft, setTimeLeft] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [roundEndData, setRoundEndData] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [error, setError] = useState(null);
  const [drawingData, setDrawingData] = useState([]); // For canvas replay

  const isDrawer = playerId === currentDrawerId;
  const isHost = players.find(p => p.id === playerId)?.isHost;

  // ─── Socket Event Listeners ─────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Room created (you are the host)
    socket.on('room_created', ({ roomId, players, settings, playerId }) => {
      setRoomId(roomId);
      setPlayers(players);
      setSettings(settings);
      setPlayerId(playerId);
      setGamePhase('lobby');
      setError(null);
    });

    // Room joined (you joined someone else's room)
    socket.on('room_joined', ({ roomId, players, settings, playerId, drawingData }) => {
      setRoomId(roomId);
      setPlayers(players);
      setSettings(settings);
      setPlayerId(playerId);
      setDrawingData(drawingData || []);
      setGamePhase('lobby');
      setError(null);
    });

    // Someone else joined
    socket.on('player_joined', ({ players }) => {
      setPlayers(players);
    });

    // Someone left
    socket.on('player_left', ({ players, playerId: leftId }) => {
      setPlayers(players);
      addSystemMessage(`A player left the game`);
    });

    // ── Game Events ──────────────────────────────────────────────────

    // New round starting
    socket.on('round_start', ({ round, totalRounds, drawerId, drawerName, wordOptions, drawTime }) => {
      setRound(round);
      setTotalRounds(totalRounds);
      setCurrentDrawerId(drawerId);
      setWordOptions(wordOptions || []); // Only the drawer gets options
      setHint('');
      setTimeLeft(drawTime);
      setRoundEndData(null);
      setDrawingData([]); // Clear canvas on round start

      if (wordOptions) {
        // This player IS the drawer
        setGamePhase('choosing');
      } else {
        // This player is guessing
        setGamePhase('drawing');
        addSystemMessage(`${drawerName} is choosing a word...`);
      }
    });

    // Drawing phase started (word was chosen)
    socket.on('drawing_phase', ({ hint, drawTime }) => {
      setHint(hint);
      setTimeLeft(drawTime);
      setGamePhase('drawing');
    });

    // Timer tick
    socket.on('timer_tick', ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    // Hint revealed
    socket.on('hint_update', ({ hint }) => {
      setHint(hint);
    });

    // Someone guessed correctly
    socket.on('guess_result', ({ correct, playerName, points, scores }) => {
      if (correct) {
        addSystemMessage(`🎉 ${playerName} guessed the word! (+${points} points)`);
        // Update scores
        setPlayers(prev => prev.map(p => {
          const score = scores.find(s => s.id === p.id);
          return score ? { ...p, score: score.score } : p;
        }));
      }
    });

    // Chat or wrong guess message
    socket.on('chat_message', ({ type, playerName, text, correct }) => {
      setChatMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: type === 'guess' ? (correct ? 'correct' : 'wrong_guess') : 'chat',
        playerName,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    });

    // Round ended
    socket.on('round_end', ({ word, scores }) => {
      setGamePhase('roundEnd');
      setRoundEndData({ word, scores });
      setPlayers(prev => prev.map(p => {
        const score = scores.find(s => s.id === p.id);
        return score ? { ...p, score: score.score } : p;
      }));
    });

    // Game over!
    socket.on('game_over', ({ winner, leaderboard }) => {
      setGamePhase('gameOver');
      setGameOverData({ winner, leaderboard });
    });

    // Canvas events
    socket.on('canvas_cleared', () => {
      setDrawingData([]);
    });

    socket.on('canvas_replay', ({ drawingData }) => {
      setDrawingData([...drawingData]);
    });

    // Error from server
    socket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(null), 3000);
    });

    // Cleanup: remove all listeners when hook unmounts or socket changes
    return () => {
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('round_start');
      socket.off('drawing_phase');
      socket.off('timer_tick');
      socket.off('hint_update');
      socket.off('guess_result');
      socket.off('chat_message');
      socket.off('round_end');
      socket.off('game_over');
      socket.off('canvas_cleared');
      socket.off('canvas_replay');
      socket.off('error');
    };
  }, [socket]);

  // ─── Helper: add a system message to chat ───────────────────────────
  const addSystemMessage = (text) => {
    setChatMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      type: 'system',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  // ─── Actions (things the user can do) ───────────────────────────────
  const createRoom = useCallback((playerName, settings, avatarId) => {
    socket.emit('create_room', { playerName, settings, avatarId });
  }, [socket]);

  const joinRoom = useCallback((roomId, playerName, avatarId) => {
    socket.emit('join_room', { roomId, playerName, avatarId });
  }, [socket]);

  const startGame = useCallback(() => {
    socket.emit('start_game', { roomId });
  }, [socket, roomId]);

  const chooseWord = useCallback((word) => {
    socket.emit('word_chosen', { roomId, word });
    setGamePhase('drawing');
    setHint(word.split('').map(() => '_').join(' '));
  }, [socket, roomId]);

  const sendGuess = useCallback((text) => {
    socket.emit('guess', { roomId, text });
  }, [socket, roomId]);

  const sendChat = useCallback((text) => {
    socket.emit('chat', { roomId, text });
  }, [socket, roomId]);

  const sendDrawStart = useCallback((data) => {
    socket.emit('draw_start', { roomId, ...data });
  }, [socket, roomId]);

  const sendDrawMove = useCallback((data) => {
    socket.emit('draw_move', { roomId, ...data });
  }, [socket, roomId]);

  const sendDrawEnd = useCallback(() => {
    socket.emit('draw_end', { roomId });
  }, [socket, roomId]);

  const sendClearCanvas = useCallback(() => {
    socket.emit('canvas_clear', { roomId });
    setDrawingData([]);
  }, [socket, roomId]);

  const sendUndo = useCallback(() => {
    socket.emit('draw_undo', { roomId });
  }, [socket, roomId]);

  const playAgain = useCallback(() => {
    setGamePhase('lobby');
    setGameOverData(null);
    setRoundEndData(null);
    setChatMessages([]);
    setRound(0);
  }, []);

  return {
    // State
    roomId, playerId, players, settings, gamePhase,
    currentDrawerId, round, totalRounds, wordOptions,
    hint, timeLeft, chatMessages, roundEndData, gameOverData,
    error, drawingData, isDrawer, isHost,
    // Actions
    createRoom, joinRoom, startGame, chooseWord,
    sendGuess, sendChat,
    sendDrawStart, sendDrawMove, sendDrawEnd,
    sendClearCanvas, sendUndo,
    playAgain
  };
}
