// Scoreboard.js - Shows players and their scores in the sidebar

import React from 'react';

const AVATARS = [
  { id: 0, emoji: '🦁' },
  { id: 1, emoji: '🐸' },
  { id: 2, emoji: '🦋' },
  { id: 3, emoji: '🦊' },
  { id: 4, emoji: '🐧' },
  { id: 5, emoji: '🦝' },
  { id: 6, emoji: '🦆' },
  { id: 7, emoji: '🦎' }
];

export default function Scoreboard({ players, currentDrawerId, playerId }) {
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  const getAvatarEmoji = (avatarId) => {
    const avatar = AVATARS.find(a => a.id === avatarId);
    return avatar ? avatar.emoji : '🐸';
  };

  return (
    <div className="scoreboard">
      <div className="scoreboard-header">🏆 Scoreboard</div>
      <div className="score-list">
        {sorted.map((player, i) => (
          <div
            key={player.id}
            className={`score-item 
              ${player.id === playerId ? 'you' : ''} 
              ${player.id === currentDrawerId ? 'drawing' : ''}
              ${player.spectator ? 'spectator' : ''}`}
          >
            <span className="score-rank">#{i + 1}</span>
            <div className="score-avatar">
              {getAvatarEmoji(player.avatarId || 0)}
            </div>
            <span className="score-name">
              {player.name}
              {player.id === playerId && ' 👤'}
              {player.id === currentDrawerId && ' ✏️'}
              {player.spectator && ' 👁️'}
            </span>
            <span className="score-points">{player.score || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getColor(i) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
                  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#82E0AA'];
  return colors[i % colors.length];
}
