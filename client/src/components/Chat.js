// Chat.js - The chat/guessing panel on the right side of the game
// Doubles as a chat box and a guess input

import React, { useState, useEffect, useRef } from 'react';

export default function Chat({ messages, isDrawer, onGuess, onChat, currentDrawerId, playerId }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (isDrawer) {
      // Drawer can only chat (not guess)
      onChat(input.trim());
    } else {
      // Non-drawers send guesses
      onGuess(input.trim());
    }
    setInput('');
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        💬 {isDrawer ? 'Chat' : 'Guess / Chat'}
      </div>

      <div className="chat-messages">
        {messages.map(msg => (
          <ChatMessage key={msg.id} msg={msg} playerId={playerId} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder={isDrawer ? 'Chat...' : 'Type your guess...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          maxLength={100}
          autoComplete="off"
        />
        <button type="submit" className="chat-send-btn">
          {isDrawer ? '💬' : '🔍'}
        </button>
      </form>
    </div>
  );
}

function ChatMessage({ msg, playerId }) {
  if (msg.type === 'system') {
    return <div className="msg msg-system">{msg.text}</div>;
  }

  if (msg.type === 'correct') {
    return (
      <div className="msg msg-correct">
        ✅ {msg.playerName} guessed the word!
      </div>
    );
  }

  const isOwn = msg.playerId === playerId;

  return (
    <div className={`msg msg-chat ${isOwn ? 'own' : ''}`}>
      <span className="msg-sender">{msg.playerName}: </span>
      <span className="msg-text">{msg.text}</span>
    </div>
  );
}
