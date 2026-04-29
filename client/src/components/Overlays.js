// Overlays.js - Round end and game over screens

import React from 'react';

export function RoundEndOverlay({ roundEndData }) {
  if (!roundEndData) return null;
  const sorted = [...(roundEndData.scores || [])].sort((a, b) => b.score - a.score);

  return (
    <div className="overlay">
      <div className="overlay-modal round-end-modal">
        <div className="round-end-word">
          <span className="label">The word was</span>
          <span className="big-word">✨ {roundEndData.word} ✨</span>
        </div>
        <div className="round-scores">
          {sorted.map((p, i) => (
            <div key={p.id} className="score-row">
              <span className="rank">{['🥇','🥈','🥉'][i] || `#${i+1}`}</span>
              <span className="name">{p.name}</span>
              <span className="pts">{p.score} pts</span>
            </div>
          ))}
        </div>
        <p className="next-round-msg">Next round starting soon...</p>
      </div>
    </div>
  );
}

export function GameOverOverlay({ gameOverData, onPlayAgain, isHost }) {
  if (!gameOverData) return null;
  const { winner, leaderboard } = gameOverData;

  return (
    <div className="overlay">
      <div className="overlay-modal game-over-modal">
        <h1 className="game-over-title">🎉 Game Over!</h1>
        <div className="winner-section">
          <div className="winner-crown">👑</div>
          <div className="winner-name">{winner?.name}</div>
          <div className="winner-score">{winner?.score} points</div>
        </div>

        <div className="final-leaderboard">
          <h3>Final Standings</h3>
          {leaderboard.map((p, i) => (
            <div key={p.id} className={`lb-row ${i === 0 ? 'lb-winner' : ''}`}>
              <span className="lb-rank">{['🥇','🥈','🥉'][i] || `#${i+1}`}</span>
              <span className="lb-name">{p.name}</span>
              <span className="lb-score">{p.score} pts</span>
            </div>
          ))}
        </div>

        {isHost && (
          <button className="btn btn-primary btn-large" onClick={onPlayAgain}>
            🔄 Play Again
          </button>
        )}
        {!isHost && (
          <p className="waiting-msg">Waiting for host to start a new game...</p>
        )}
      </div>
    </div>
  );
}
