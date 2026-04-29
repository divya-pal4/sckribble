// GamePage.js - The main game screen
// Assembles: top bar, scoreboard, canvas, word choosing, chat

import React from 'react';
import Canvas from '../components/Canvas';
import Chat from '../components/Chat';
import Scoreboard from '../components/Scoreboard';

export default function GamePage({
  roomId, players, playerId, currentDrawerId,
  round, totalRounds, wordOptions, hint, timeLeft,
  chatMessages, isDrawer, gamePhase,
  onChooseWord, onGuess, onChat,
  onClear, onUndo, drawingData
}) {
  const drawer = players.find(p => p.id === currentDrawerId);
  const timerPercent = timeLeft / (timeLeft > 0 ? Math.max(timeLeft, 1) : 1);
  const timerWarning = timeLeft <= 15;

  return (
    <div className="game-page">
      {/* Top Bar */}
      <div className="game-topbar">
        <div className="round-info">
          Round {round} of {totalRounds}
        </div>

        <div className="word-area">
          {gamePhase === 'drawing' && (
            isDrawer ? (
              <span className="drawer-word-display">
                You're drawing!
              </span>
            ) : (
              <div className="hint-display">
                <span className="hint-text">{hint}</span>
              </div>
            )
          )}
          {gamePhase === 'choosing' && !isDrawer && (
            <span className="status-text">✏️ {drawer?.name} is choosing a word...</span>
          )}
          {gamePhase === 'roundEnd' && (
            <span className="status-text">⏰ Round over! Next round starting...</span>
          )}
        </div>

        <div className={`timer ${timerWarning ? 'timer-warning' : ''}`}>
          ⏱ {timeLeft}s
        </div>
      </div>

      {/* Timer progress bar */}
      <div className="timer-bar-wrapper">
        <div
          className={`timer-bar ${timerWarning ? 'timer-bar-warning' : ''}`}
          style={{ width: `${Math.max(0, (timeLeft / 80) * 100)}%` }}
        />
      </div>

      {/* Main game layout */}
      <div className="game-layout">
        {/* Left: Scoreboard */}
        <Scoreboard
          players={players}
          currentDrawerId={currentDrawerId}
          playerId={playerId}
        />

        {/* Center: Canvas */}
        <div className="canvas-area">
          <Canvas
            roomId={roomId}
            isDrawer={isDrawer && gamePhase === 'drawing'}
            drawingData={drawingData}
            onClear={onClear}
            onUndo={onUndo}
          />
        </div>

        {/* Right: Chat */}
        <Chat
          messages={chatMessages}
          isDrawer={isDrawer}
          onGuess={onGuess}
          onChat={onChat}
          currentDrawerId={currentDrawerId}
          playerId={playerId}
        />
      </div>

      {/* Word Choosing Overlay */}
      {gamePhase === 'choosing' && isDrawer && wordOptions.length > 0 && (
        <div className="overlay">
          <div className="word-choice-modal">
            <h2>Choose Your Word</h2>
            <p>Pick a word to draw. Others will try to guess it!</p>
            <div className="word-options">
              {wordOptions.map(word => (
                <button
                  key={word}
                  className="word-option-btn"
                  onClick={() => onChooseWord(word)}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Round End Overlay */}
      {gamePhase === 'roundEnd' && (
        <div className="overlay overlay-dark">
          <div className="round-end-modal">
            <h2>⏰ Round Over!</h2>
            <p>The word was: <strong className="reveal-word">{/* shown via roundEndData */}</strong></p>
          </div>
        </div>
      )}
    </div>
  );
}
