import React, { useEffect, useState } from 'react';
import { useSession } from './SessionContext';

const SERVER_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SERVER_URL) || 'http://localhost:3001';

export default function VideoGallery({ refreshTrigger }) {
  const { role, hostState, setHostState } = useSession();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [modalVideo, setModalVideo] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState('');

  const fetchVideos = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${SERVER_URL}/videos`);
      if (!res.ok) throw new Error('Failed to fetch videos');
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      setError('Could not load videos.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
    // eslint-disable-next-line
  }, [refreshTrigger]);

  const handleDelete = async (filename) => {
    if (!window.confirm('Delete this video?')) return;
    setDeleting(filename);
    try {
      const res = await fetch(`${SERVER_URL}/movie/${filename}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setVideos(videos => videos.filter(v => v.filename !== filename));
    } catch {
      alert('Failed to delete video.');
    }
    setDeleting(null);
  };

  const openModal = (video) => setModalVideo(video);
  const closeModal = () => setModalVideo(null);

  const startRenaming = (video) => {
    setRenaming(video.filename);
    setRenameValue(video.filename);
    setRenameError('');
  };
  const cancelRenaming = () => {
    setRenaming(null);
    setRenameValue('');
    setRenameError('');
  };
  const submitRename = async (oldFilename) => {
    if (!renameValue.endsWith('.mp4')) {
      setRenameError('Filename must end with .mp4');
      return;
    }
    if (renameValue === oldFilename) {
      setRenaming(null);
      return;
    }
    try {
      const res = await fetch(`${SERVER_URL}/movie/${oldFilename}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: renameValue })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRenameError(data.error || 'Failed to rename');
        return;
      }
      setRenaming(null);
      setRenameValue('');
      setRenameError('');
      fetchVideos();
    } catch {
      setRenameError('Failed to rename');
    }
  };

  const selectVideo = (filename) => {
    if (role === 'host' && setHostState) {
      setHostState({ currentVideo: filename, time: 0, paused: true });
    }
  };

  if (loading) return <div style={{ color: '#aaa', marginTop: 32 }}>Loading videos...</div>;
  if (error) return <div style={{ color: '#f55', marginTop: 32 }}>{error}</div>;
  if (!videos.length) return <div style={{ color: '#aaa', marginTop: 32 }}>No videos uploaded yet.</div>;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginTop: 32, width: '100%', maxWidth: 900 }}>
        {videos.map(video => (
          <div key={video.filename} style={{ background: hostState && hostState.currentVideo === video.filename ? '#2e8bff' : '#232b3a', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px #0002', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', cursor: role === 'host' ? 'pointer' : 'default', border: hostState && hostState.currentVideo === video.filename ? '2px solid #00bfff' : 'none' }} onClick={() => selectVideo(video.filename)}>
            <div style={{ cursor: 'pointer', width: 180, height: 100 }} onClick={() => openModal(video)}>
              <video
                src={`${SERVER_URL}/movie/${video.filename}`}
                style={{ width: 180, height: 100, objectFit: 'cover', borderRadius: 8, background: '#111' }}
                controls={false}
                preload="metadata"
                poster=""
              />
            </div>
            <div style={{ fontWeight: 600, marginTop: 12, textAlign: 'center', wordBreak: 'break-all' }}>
              {renaming === video.filename ? (
                <>
                  <input
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    style={{ fontWeight: 600, fontSize: 15, borderRadius: 4, border: '1px solid #555', padding: '2px 6px', width: 140 }}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') submitRename(video.filename);
                      if (e.key === 'Escape') cancelRenaming();
                    }}
                  />
                  <button onClick={() => submitRename(video.filename)} style={{ marginLeft: 6, background: '#00bfff', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                  <button onClick={cancelRenaming} style={{ marginLeft: 4, background: '#555', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  {renameError && <div style={{ color: '#f55', fontSize: 12, marginTop: 2 }}>{renameError}</div>}
                </>
              ) : (
                <>
                  {video.filename}
                  <button onClick={() => startRenaming(video)} style={{ marginLeft: 8, background: '#222', color: '#00bfff', border: 'none', borderRadius: 4, padding: '2px 8px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Rename</button>
                </>
              )}
            </div>
            <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>{new Date(video.uploaded).toLocaleString()}</div>
            <button
              onClick={() => handleDelete(video.filename)}
              disabled={deleting === video.filename}
              style={{ marginTop: 12, background: '#f55', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontWeight: 600, opacity: deleting === video.filename ? 0.6 : 1 }}
            >
              {deleting === video.filename ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ))}
      </div>
      {modalVideo && (
        <div onClick={closeModal} style={{ position: 'fixed', zIndex: 1000, left: 0, top: 0, width: '100vw', height: '100vh', background: '#000a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#232b3a', borderRadius: 16, padding: 32, boxShadow: '0 4px 32px #0008', minWidth: 320, maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: 24, right: 32, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', fontWeight: 700, zIndex: 10 }}>&times;</button>
            <video
              src={`${SERVER_URL}/movie/${modalVideo.filename}`}
              controls
              autoPlay
              style={{ width: 480, maxWidth: '80vw', maxHeight: '60vh', borderRadius: 12, background: '#000' }}
            />
            <div style={{ fontWeight: 700, fontSize: 20, marginTop: 18, textAlign: 'center', wordBreak: 'break-all' }}>{modalVideo.filename}</div>
            <div style={{ fontSize: 15, color: '#aaa', marginTop: 4 }}>{new Date(modalVideo.uploaded).toLocaleString()}</div>
          </div>
        </div>
      )}
    </>
  );
} 