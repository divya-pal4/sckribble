// App.js - The root component
// Decides WHICH screen to show based on gamePhase:
//   home    → Home (create/join)
//   lobby   → Lobby (waiting room)
//   drawing/choosing/roundEnd → GamePage
//   gameOver → GamePage + GameOverOverlay

import React from 'react';
import { useGame } from './hooks/useGame';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import GamePage from './pages/GamePage';
import { RoundEndOverlay, GameOverOverlay } from './components/Overlays';

export default function App() {
  const game = useGame();

  const {
    gamePhase, roomId, playerId, players, settings,
    currentDrawerId, round, totalRounds, wordOptions, hint, timeLeft,
    chatMessages, roundEndData, gameOverData, error, drawingData,
    isDrawer, isHost,
    createRoom, joinRoom, startGame, chooseWord,
    sendGuess, sendChat, sendClearCanvas, sendUndo, sendReaction,
    playAgain
  } = game;

  // ── Screen: Home ────────────────────────────────────────────────────
  if (gamePhase === 'home') {
    return (
      <div className="app">
        <Home
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          error={error}
        />
      </div>
    );
  }

  // ── Screen: Lobby ───────────────────────────────────────────────────
  if (gamePhase === 'lobby') {
    return (
      <div className="app">
        <Lobby
          roomId={roomId}
          players={players}
          settings={settings}
          playerId={playerId}
          isHost={isHost}
          onStart={startGame}
          error={error}
        />
      </div>
    );
  }

  // ── Screen: Game ─────────────────────────────────────────────────────
  return (
    <div className="app">
      <GamePage
        roomId={roomId}
        players={players}
        playerId={playerId}
        currentDrawerId={currentDrawerId}
        round={round}
        totalRounds={totalRounds}
        wordOptions={wordOptions}
        hint={hint}
        timeLeft={timeLeft}
        chatMessages={chatMessages}
        isDrawer={isDrawer}
        gamePhase={gamePhase}
        drawingData={drawingData}
        onChooseWord={chooseWord}
        onGuess={sendGuess}
        onChat={sendChat}
        onClear={sendClearCanvas}
        onUndo={sendUndo}
      />

      {/* These overlays sit on top of the game screen when needed */}
      {gamePhase === 'roundEnd' && roundEndData && (
        <RoundEndOverlay roundEndData={roundEndData} />
      )}

      {gamePhase === 'gameOver' && gameOverData && (
        <GameOverOverlay
          gameOverData={gameOverData}
          onPlayAgain={playAgain}
          isHost={isHost}
        />
      )}

      {error && (
        <div className="toast-error">⚠️ {error}</div>
      )}
    </div>
  );
}
