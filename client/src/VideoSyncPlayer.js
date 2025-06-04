import React, { useEffect, useRef, useState } from 'react';
import { useSession } from './SessionContext';

const SERVER_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SERVER_URL) || 'http://localhost:3001';

export default function VideoSyncPlayer() {
  const { role, hostState, setHostState, sendMessage } = useSession();
  const videoRef = useRef();
  const [internalSeek, setInternalSeek] = useState(false);
  const [resyncing, setResyncing] = useState(false);

  // Host: broadcast play/pause/seek
  useEffect(() => {
    if (role !== 'host' || !videoRef.current) return;
    const video = videoRef.current;
    const onPlay = () => setHostState({ ...hostState, paused: false, time: video.currentTime });
    const onPause = () => setHostState({ ...hostState, paused: true, time: video.currentTime });
    const onSeeked = () => setHostState({ ...hostState, time: video.currentTime });
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('seeked', onSeeked);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('seeked', onSeeked);
    };
  }, [role, hostState, setHostState]);

  // Client: sync to hostState
  useEffect(() => {
    if (role !== 'client' || !videoRef.current || !hostState) return;
    const video = videoRef.current;
    // Only seek if difference is significant
    if (Math.abs(video.currentTime - (hostState.time || 0)) > 0.5) {
      setInternalSeek(true);
      video.currentTime = hostState.time || 0;
    }
    if (hostState.paused) {
      video.pause();
    } else {
      // Only play if not already playing
      if (video.paused) video.play().catch(() => {});
    }
  }, [hostState, role]);

  // Prevent loop on seek
  useEffect(() => {
    if (!internalSeek) return;
    const timeout = setTimeout(() => setInternalSeek(false), 200);
    return () => clearTimeout(timeout);
  }, [internalSeek]);

  // Client: handle resync
  useEffect(() => {
    if (role === 'client' && resyncing) {
      setResyncing(false);
    }
    // eslint-disable-next-line
  }, [hostState]);

  // Host: respond to sync_request from clients
  useEffect(() => {
    if (role !== 'host') return;
    function onMsg(event) {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === 'sync_request' && data.from) {
        sendMessage({
          type: 'sync_response',
          to: data.from,
          state: {
            ...hostState,
            time: videoRef.current ? videoRef.current.currentTime : (hostState?.time || 0),
            paused: videoRef.current ? videoRef.current.paused : (hostState?.paused ?? true),
          }
        });
      }
    }
    const ws = window._ws;
    if (ws) ws.addEventListener('message', onMsg);
    return () => { if (ws) ws.removeEventListener('message', onMsg); };
  }, [role, hostState, sendMessage]);

  const handleResync = () => {
    setResyncing(true);
    sendMessage({ type: 'sync_request' });
  };

  if (!hostState || !hostState.currentVideo) return null;
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#232b3a',
      borderRadius: 16,
      padding: 24,
      boxShadow: '0 4px 24px #0003',
      border: '1.5px solid #222',
      minWidth: 0,
      minHeight: 0,
      height: '100%',
      boxSizing: 'border-box',
      margin: 0,
    }}>
      <video
        ref={videoRef}
        src={`${SERVER_URL}/movie/${hostState.currentVideo}`}
        controls
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          maxWidth: '100%',
          borderRadius: 10,
          background: '#000',
          boxShadow: '0 2px 8px #0005',
          objectFit: 'contain',
        }}
      />
      <div style={{ color: '#aaa', marginTop: 12, fontSize: 16, fontWeight: 500 }}>
        Now playing: <b>{hostState.currentVideo}</b>
      </div>
      {role === 'client' && (
        <button
          onClick={handleResync}
          disabled={resyncing}
          style={{ marginTop: 16, background: '#00bfff', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 16, cursor: 'pointer', opacity: resyncing ? 0.6 : 1, boxShadow: '0 2px 8px #00bfff33' }}
        >
          {resyncing ? 'Resyncing...' : 'Resync'}
        </button>
      )}
    </div>
  );
} 