import React, { useState, useEffect } from 'react';
import { SessionProvider, useSession } from './SessionContext';
import JoinSession from './JoinSession';
import UploadMovie from './UploadMovie';
import VideoGallery from './VideoGallery';
import VideoSyncPlayer from './VideoSyncPlayer';
import UserChatPanel from './UserChatPanel';

function MovieDrawer({ open, onClose, isHost }) {
  const [dragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef();
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'video/mp4');
      if (files.length && inputRef.current) {
        const dataTransfer = new DataTransfer();
        files.forEach(f => dataTransfer.items.add(f));
        inputRef.current.files = dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        inputRef.current.dispatchEvent(event);
      }
    }
  };
  const handleChange = (e) => {
    // Forward to UploadMovie if needed, or just let VideoGallery handle refresh
  };
  return open ? (
    <div style={{
      position: 'fixed',
      top: 60,
      left: 0,
      width: '100vw',
      height: 'calc(100vh - 60px)',
      background: 'rgba(0,0,0,0.45)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    }} onClick={onClose}>
      <div
        style={{
          width: 440,
          maxWidth: '98vw',
          minHeight: 'calc(100vh - 60px)',
          background: '#232b3a',
          boxShadow: '2px 0 24px #0006',
          borderRight: '2px solid #181c24',
          padding: 0,
          position: 'relative',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 28,
            cursor: 'pointer',
            zIndex: 10,
          }}
          aria-label="Close movie list"
        >
          &times;
        </button>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            padding: '32px 24px 16px 24px',
            marginTop: 0,
            minWidth: 400,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            border: dragActive ? '2px solid #00bfff' : '2px dashed #181c24',
            borderRadius: 16,
            background: dragActive ? '#232b3a' : 'transparent',
            transition: 'border 0.2s, background 0.2s',
          }}
          onClick={() => inputRef.current && inputRef.current.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4"
            multiple
            style={{ display: 'none' }}
            onChange={handleChange}
          />
          <div style={{ marginBottom: 18 }}>
            <span style={{ display: 'inline-block', background: '#181c24', borderRadius: '50%', padding: 18, boxShadow: '0 2px 8px #0003' }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="34" width="28" height="4" rx="2" fill="#00bfff" />
                <rect x="22" y="14" width="4" height="16" rx="2" fill="#00bfff" />
                <rect x="14" y="22" width="20" height="4" rx="2" fill="#00bfff" />
              </svg>
            </span>
          </div>
          <div style={{ color: '#aaa', fontSize: 16, marginBottom: 18, textAlign: 'center' }}>
            Drag & drop <b>.mp4</b> files here or click the icon to upload.
          </div>
          <VideoGallery />
        </div>
      </div>
    </div>
  ) : null;
}

function TopBar({ onHamburger, user, role, users, onRename }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [error, setError] = useState('');
  useEffect(() => {
    setName(user.name);
  }, [user.name]);
  const taken = users.some(u => u.name === name && u.id !== user.id);
  const isHostName = users.find(u => u.role === 'host')?.name === name && user.role !== 'host';

  const handleRename = () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    if (taken) {
      setError('Name is already taken');
      return;
    }
    if (isHostName) {
      setError('Cannot use the host name');
      return;
    }
    setError('');
    onRename(name.trim());
    setEditing(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: 60,
      background: 'rgba(24,28,36,0.98)',
      zIndex: 4000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 12px #0004',
      padding: '0 18px',
      borderBottom: '1.5px solid #232b3a',
      boxSizing: 'border-box',
    }}>
      <button
        onClick={onHamburger}
        style={{
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: 28,
          cursor: 'pointer',
          padding: 4,
          borderRadius: 6,
          zIndex: 4100,
          transition: 'background 0.2s',
        }}
        aria-label="Open movie list"
      >
        <span style={{ display: 'inline-block', width: 28, height: 28 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect y="5" width="28" height="3" rx="1.5" fill="#fff" />
            <rect y="12.5" width="28" height="3" rx="1.5" fill="#fff" />
            <rect y="20" width="28" height="3" rx="1.5" fill="#fff" />
          </svg>
        </span>
      </button>
      <div style={{ flex: 1, textAlign: 'center', fontWeight: 800, fontSize: 28, letterSpacing: 1, color: '#fff', textShadow: '0 2px 8px #0004' }}>
        MovieSync
      </div>
      <div style={{ minWidth: 180, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        {editing ? (
          <>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1.5px solid #444', background: '#181c24', color: '#fff', fontSize: 15, width: 110 }}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(false); }}
              autoFocus
            />
            <button onClick={handleRename} style={{ background: '#00bfff', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Save</button>
            <button onClick={() => setEditing(false)} style={{ background: '#555', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
          </>
        ) : (
          <>
            <span style={{ color: '#00bfff', fontWeight: 700 }}>{user.name}</span>
            <span style={{ color: '#aaa', fontSize: 13, marginLeft: 4 }}>({role})</span>
            {role !== 'host' && (
              <button onClick={() => setEditing(true)} style={{ background: 'none', color: '#fff', border: '1.5px solid #444', borderRadius: 6, padding: '2px 8px', fontWeight: 600, fontSize: 14, marginLeft: 8, cursor: 'pointer' }}>Rename</button>
            )}
          </>
        )}
        {error && <div style={{ color: '#f55', fontSize: 12, marginLeft: 8 }}>{error}</div>}
      </div>
    </div>
  );
}

function MainUI() {
  const { user, role, hostState, users, sendMessage } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hostName, setHostName] = useState(user ? user.name : '');
  const [hostNameError, setHostNameError] = useState('');
  useEffect(() => {
    if (user && user.name !== hostName) setHostName(user.name);
  }, [user]);
  if (!user) return <JoinSession />;
  const isWide = window.innerWidth > 900;
  const handleRename = (newName) => {
    sendMessage({ type: 'set_name', name: newName });
  };
  const taken = users.some(u => u.name === hostName && u.id !== user.id);
  const isHostName = users.find(u => u.role === 'host')?.name === hostName && user.role !== 'host';
  const handleHostNameChange = () => {
    if (!hostName.trim()) {
      setHostNameError('Name cannot be empty');
      return;
    }
    if (taken) {
      setHostNameError('Name is already taken');
      return;
    }
    if (isHostName) {
      setHostNameError('Cannot use the host name');
      return;
    }
    setHostNameError('');
    handleRename(hostName.trim());
  };
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #181c24 0%, #232b3a 100%)',
      color: '#fff',
      position: 'relative',
    }}>
      <TopBar onHamburger={() => setDrawerOpen(true)} user={user} role={role} users={users} onRename={handleRename} />
      <MovieDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} isHost={role === 'host'} />
      <div style={{
        width: '100vw',
        minHeight: '100vh',
        boxSizing: 'border-box',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: 60,
      }}>
        {role === 'host' && (!hostState || !hostState.currentVideo) && (
          <div style={{ width: 440, maxWidth: '98vw', margin: '0 auto 18px auto', background: '#232b3a', borderRadius: 16, boxShadow: '0 4px 24px #0003', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>Upload a Movie</div>
            <UploadMovie />
            <div style={{ marginTop: 18, width: '100%', maxWidth: 400 }}>
              <div style={{ color: '#aaa', fontSize: 15, marginBottom: 4 }}>Set your username:</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                <input
                  value={hostName}
                  onChange={e => { setHostName(e.target.value); setHostNameError(''); }}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1.5px solid #444', background: '#181c24', color: '#fff', fontSize: 15, flex: 1, minWidth: 0 }}
                  onKeyDown={e => { if (e.key === 'Enter') handleHostNameChange(); }}
                />
                <button onClick={handleHostNameChange} style={{ background: '#00bfff', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', flexShrink: 0 }}>Set</button>
                {hostNameError && <span style={{ color: '#f55', fontSize: 13 }}>{hostNameError}</span>}
              </div>
            </div>
          </div>
        )}
        {hostState && hostState.currentVideo ? (
          <div
            style={{
              display: 'flex',
              flexDirection: isWide ? 'row' : 'column',
              alignItems: isWide ? 'stretch' : 'center',
              width: '100%',
              maxWidth: 1800,
              minHeight: 0,
              flex: 1,
              gap: 10,
              boxSizing: 'border-box',
              padding: 0,
            }}
          >
            <div
              style={{
                flex: isWide ? '1 1 0' : '1 1 100%',
                minWidth: isWide ? 0 : 320,
                maxWidth: isWide ? 'calc(100vw - 370px - 30px)' : '100%',
                minHeight: 0,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'flex-start',
                height: isWide ? 'calc(100vh - 110px)' : 'auto',
                maxHeight: isWide ? 'calc(100vh - 110px)' : 'none',
                marginRight: isWide ? 10 : 0,
                marginBottom: isWide ? 0 : 10,
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
                <VideoSyncPlayer />
              </div>
            </div>
            <div
              style={{
                flex: '0 0 340px',
                minWidth: 280,
                maxWidth: 340,
                boxSizing: 'border-box',
                alignSelf: isWide ? 'stretch' : 'flex-start',
                height: isWide ? 'calc(100vh - 110px)' : 'auto',
                marginTop: isWide ? 0 : 10,
                maxHeight: isWide ? 'calc(100vh - 110px)' : 'none',
                minHeight: 0,
                overflow: 'auto',
                marginLeft: isWide ? 10 : 0,
              }}
            >
              <UserChatPanel />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function App() {
  return (
    <SessionProvider>
      <MainUI />
    </SessionProvider>
  );
}

export default App;
