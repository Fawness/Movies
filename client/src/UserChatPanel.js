import React, { useEffect, useRef, useState } from 'react';
import { useSession } from './SessionContext';

export default function UserChatPanel() {
  const { user, users, role, sendMessage } = useSession();
  const [tab, setTab] = useState('users');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef();

  // Listen for chat messages and moderation events
  useEffect(() => {
    function onMsg(event) {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === 'chat') {
        setMessages(msgs => [...msgs, { id: data.id, from: data.from, userId: data.userId, message: data.message }]);
      }
      if (data.type === 'delete_message') {
        setMessages(msgs => msgs.filter(m => m.id !== data.id));
      }
      if (data.type === 'kicked' && data.id === user.id) {
        alert('You have been kicked by the host.');
        window.location.reload();
      }
      if (data.type === 'banned' && data.id === user.id) {
        alert('You have been banned by the host.');
        window.location.reload();
      }
      if (data.type === 'welcome' && data.chat) {
        setMessages(data.chat);
      }
    }
    const ws = window._ws;
    if (ws) ws.addEventListener('message', onMsg);
    return () => { if (ws) ws.removeEventListener('message', onMsg); };
  }, [user.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage({ type: 'chat', message: chatInput.trim() });
      setChatInput('');
    }
  };

  const handleKick = (id) => {
    if (window.confirm('Kick this user?')) {
      sendMessage({ type: 'kick', id });
    }
  };
  const handleBan = (id) => {
    if (window.confirm('Ban this user?')) {
      sendMessage({ type: 'ban', id });
    }
  };
  const handleDeleteMsg = (id) => {
    if (window.confirm('Delete this message?')) {
      sendMessage({ type: 'delete_message', id });
    }
  };

  return (
    <div style={{
      minWidth: 280,
      maxWidth: 340,
      width: '100%',
      background: '#232b3a',
      borderRadius: 16,
      boxShadow: '0 4px 24px #0003',
      marginLeft: 0,
      marginTop: 0,
      display: 'flex',
      flexDirection: 'column',
      height: 420,
      maxHeight: '60vh',
      overflow: 'hidden',
      border: '1.5px solid #222',
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', borderBottom: '1.5px solid #333', background: '#20232a' }}>
        <button onClick={() => setTab('users')} style={{ flex: 1, padding: 12, background: tab === 'users' ? '#181c24' : 'none', color: '#fff', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', borderRadius: '16px 0 0 0' }}>Users</button>
        <button onClick={() => setTab('chat')} style={{ flex: 1, padding: 12, background: tab === 'chat' ? '#181c24' : 'none', color: '#fff', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', borderRadius: '0 16px 0 0' }}>Chat</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', background: '#232b3a', padding: 18 }}>
        {tab === 'users' ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {users.map(u => (
              <li key={u.id} style={{
                padding: '10px 0',
                color: u.id === user.id ? '#00bfff' : u.role === 'host' ? '#ffb300' : '#fff',
                fontWeight: u.id === user.id ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderBottom: '1px solid #222',
                marginBottom: 2,
              }}>
                <span style={{ fontSize: 18 }}>{u.role === 'host' ? '👑' : '👤'}</span>
                <span>{u.name}</span>
                {u.id === user.id && <span style={{ fontSize: 12, color: '#00bfff', marginLeft: 4 }}>(You)</span>}
                {u.role === 'host' && <span style={{ fontSize: 12, color: '#ffb300', marginLeft: 4 }}>(Host)</span>}
                {role === 'host' && u.id !== user.id && (
                  <>
                    <button onClick={() => handleKick(u.id)} style={{ marginLeft: 8, background: '#f55', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontWeight: 600, cursor: 'pointer', fontSize: 13, boxShadow: '0 1px 4px #f553' }}>Kick</button>
                    <button onClick={() => handleBan(u.id)} style={{ marginLeft: 4, background: '#b00', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontWeight: 600, cursor: 'pointer', fontSize: 13, boxShadow: '0 1px 4px #b003' }}>Ban</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 8, overflowAnchor: 'auto', background: '#20232a', borderRadius: 8, padding: 8 }}>
              {messages.length === 0 && <div style={{ color: '#aaa', textAlign: 'center', marginTop: 32 }}>No messages yet.</div>}
              {messages.map((msg, i) => (
                <div key={msg.id} style={{ marginBottom: 8, color: msg.from === user.name ? '#00bfff' : '#fff', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #222', paddingBottom: 4 }}>
                  <span style={{ fontWeight: 700 }}>{msg.from}:</span> {msg.message}
                  {role === 'host' && (
                    <button onClick={() => handleDeleteMsg(msg.id)} style={{ marginLeft: 8, background: '#f55', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontWeight: 600, cursor: 'pointer', fontSize: 13, boxShadow: '0 1px 4px #f553' }}>Delete</button>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type a message..."
                style={{ flex: 1, padding: 10, borderRadius: 8, border: '1.5px solid #444', background: '#181c24', color: '#fff', fontSize: 15, boxShadow: '0 1px 4px #0002' }}
              />
              <button type="submit" style={{ padding: '10px 20px', borderRadius: 8, background: '#00bfff', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 1px 4px #00bfff33' }}>Send</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
} 