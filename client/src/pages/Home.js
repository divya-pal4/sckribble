import React, { useState, useEffect } from 'react';

const AVATARS = [
  { id: 0, emoji: '🦁', label: 'Lion' },
  { id: 1, emoji: '🐸', label: 'Frog' },
  { id: 2, emoji: '🦋', label: 'Butterfly' },
  { id: 3, emoji: '🦊', label: 'Fox' },
  { id: 4, emoji: '🐧', label: 'Penguin' },
  { id: 5, emoji: '🦝', label: 'Raccoon' },
  { id: 6, emoji: '🦆', label: 'Duck' },
  { id: 7, emoji: '🦎', label: 'Lizard' }
];

export default function Home({ onCreateRoom, onJoinRoom, error }) {
  const [playerName, setPlayerName] = useState('');
  const [avatarId, setAvatarId] = useState(0);
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState('create');
  const [settings, setSettings] = useState({
    maxPlayers: 8, rounds: 3, drawTime: 80,
    wordCount: 3, hints: 2, isPrivate: false, customWords: ''
  });

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) { setJoinCode(hash); setTab('join'); }
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    onCreateRoom(playerName.trim(), settings, avatarId);
  };
  const handleJoin = (e) => {
    e.preventDefault();
    if (!playerName.trim() || !joinCode.trim()) return;
    onJoinRoom(joinCode.trim().toUpperCase(), playerName.trim(), avatarId);
  };

  return (
    <div className="home">
      <div className="home-hero">
        <div className="logo-lockup">
          <span className="logo-pencil">✏️</span>
          <span className="logo-title">skribbl</span>
          <span className="logo-badge">draw · guess · win</span>
        </div>
      </div>

      <div className="home-card">
        {error && <div className="error-banner">⚠️ {error}</div>}

        <div className="field">
          <label>Your Nickname</label>
          <input type="text" className="input" placeholder="Enter your name..."
            value={playerName} onChange={e => setPlayerName(e.target.value)} maxLength={20} />
        </div>

        <div className="field">
          <label>Your Avatar</label>
          <div className="avatar-picker">
            {AVATARS.map(avatar => (
              <button
                key={avatar.id}
                type="button"
                className={`avatar-option ${avatarId === avatar.id ? 'selected' : ''}`}
                onClick={() => setAvatarId(avatar.id)}
                title={avatar.label}
              >
                <span className="avatar-emoji">{avatar.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="tabs">
          <button className={`tab-btn ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
            Create Room
          </button>
          <button className={`tab-btn ${tab === 'join' ? 'active' : ''}`} onClick={() => setTab('join')}>
            Join Room
          </button>
        </div>

        {tab === 'create' && (
          <form onSubmit={handleCreate}>
            <div className="settings-grid">
              <div className="field">
                <label>Max Players</label>
                <select className="input" value={settings.maxPlayers} onChange={e => setSettings(s => ({ ...s, maxPlayers: +e.target.value }))}>
                  {[2,3,4,5,6,8,10,12,16,20].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Rounds</label>
                <select className="input" value={settings.rounds} onChange={e => setSettings(s => ({ ...s, rounds: +e.target.value }))}>
                  {[1,2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Draw Time</label>
                <select className="input" value={settings.drawTime} onChange={e => setSettings(s => ({ ...s, drawTime: +e.target.value }))}>
                  {[15,30,45,60,80,100,120,180,240].map(n => <option key={n} value={n}>{n}s</option>)}
                </select>
              </div>
              <div className="field">
                <label>Word Choices</label>
                <select className="input" value={settings.wordCount} onChange={e => setSettings(s => ({ ...s, wordCount: +e.target.value }))}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Hints</label>
                <select className="input" value={settings.hints} onChange={e => setSettings(s => ({ ...s, hints: +e.target.value }))}>
                  {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n === 0 ? 'Off' : n}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Room Type</label>
                <select className="input" value={settings.isPrivate ? 'private' : 'public'} onChange={e => setSettings(s => ({ ...s, isPrivate: e.target.value === 'private' }))}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-large" disabled={!playerName.trim()}>
              Create Room
            </button>
          </form>
        )}

        {tab === 'join' && (
          <form onSubmit={handleJoin}>
            <div className="field">
              <label>Room Code</label>
              <input type="text" className="input input-code" placeholder="ABC123"
                value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} />
            </div>
            <button type="submit" className="btn btn-primary btn-large"
              disabled={!playerName.trim() || joinCode.length < 6}>
              Join Room
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
