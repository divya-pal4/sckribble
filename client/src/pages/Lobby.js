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

export default function Lobby({ roomId, players, settings, playerId, isHost, onStart, error }) {
  const shareLink = `${window.location.origin}/#${roomId}`;
  const copyLink = () => navigator.clipboard.writeText(shareLink);

  const getAvatarEmoji = (avatarId) => {
    const avatar = AVATARS.find(a => a.id === avatarId);
    return avatar ? avatar.emoji : '🐸';
  };

  return (
    <div className="lobby">
      <div className="lobby-header">
        <h2 className="lobby-title">Game Lobby</h2>
        <div className="room-code-box">
          <span className="room-code-label">Room Code</span>
          <span className="room-code">{roomId}</span>
          <button className="btn btn-small" onClick={copyLink}>Copy invite link</button>
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="lobby-body">
        <div className="panel">
          <div className="panel-title">Players ({players.length}/{settings.maxPlayers})</div>
          <div className="player-list">
            {players.map((player, i) => (
              <div key={player.id} className={`player-item ${player.id === playerId ? 'you' : ''}`}>
                <div className="player-avatar">
                  {getAvatarEmoji(player.avatarId || 0)}
                </div>
                <span className="player-name">
                  {player.name}{player.id === playerId && ' (you)'}
                </span>
                {player.isHost && <span className="host-badge">host</span>}
              </div>
            ))}
            {Array.from({ length: Math.max(0, settings.maxPlayers - players.length) }).map((_, i) => (
              <div key={`e${i}`} className="player-item empty">
                <div className="player-avatar empty-avatar">?</div>
                <span className="player-name muted">waiting...</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Settings</div>
          <div className="settings-list">
            {[
              ['Draw time', `${settings.drawTime}s`],
              ['Rounds', settings.rounds],
              ['Word choices', settings.wordCount],
              ['Hints', settings.hints === 0 ? 'off' : settings.hints],
              ['Room', settings.isPrivate ? 'private' : 'public'],
            ].map(([k, v]) => (
              <div key={k} className="setting-row">
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>

          {isHost ? (
            <>
              <p className="host-tip">Start when everyone is in the lobby.</p>
              <button className="btn btn-primary btn-large" onClick={onStart}
                disabled={players.length < 2}>
                {players.length < 2 ? 'Need 2+ players' : 'Start Game'}
              </button>
            </>
          ) : (
            <div className="waiting-message">waiting for host to start...</div>
          )}
        </div>
      </div>
    </div>
  );
}
