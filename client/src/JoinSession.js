import React, { useState, useEffect } from 'react';
import { useSession } from './SessionContext';

export default function JoinSession() {
  const { user, users } = useSession();
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    // If there are no users, this user will be the host
    setIsHost(!users || users.length === 0);
  }, [users]);

  if (user) return null;

  const handleJoin = () => {
    setJoining(true);
    // Name is optional, handled in context
    // The backend will assign host if this is the first user
    window.setTimeout(() => setJoining(false), 1000); // fallback UI
    // The context will send set_name if name is entered
    if (name.trim()) {
      // Use context sendMessage
      const event = new CustomEvent('set_name', { detail: name.trim() });
      window.dispatchEvent(event);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#181c24', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#232b3a', padding: 32, borderRadius: 16, boxShadow: '0 2px 16px #0004', minWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ marginBottom: 18, textAlign: 'center' }}>{isHost ? 'Host Session' : 'Join Session'}</h2>
        <input
          type="text"
          placeholder="Enter your name (optional)"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ width: 240, padding: 10, borderRadius: 6, border: '1px solid #444', marginBottom: 18, fontSize: 16, textAlign: 'center', display: 'block' }}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
        />
        <button
          onClick={handleJoin}
          style={{ width: 240, padding: 10, borderRadius: 6, background: '#00bfff', color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', display: 'block' }}
          disabled={joining}
        >
          {joining ? (isHost ? 'Hosting...' : 'Joining...') : (isHost ? 'Host' : 'Join')}
        </button>
      </div>
    </div>
  );
} 