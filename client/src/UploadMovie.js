import React, { useRef, useState } from 'react';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
const UPLOAD_URL = SERVER_URL + '/upload';

export default function UploadMovie() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [uploadedFilename, setUploadedFilename] = useState(null);
  const inputRef = useRef();

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setMessage('');
    setUploadedFilename(null);
    if (file.type !== 'video/mp4') {
      setMessage('Only .mp4 files are allowed.');
      return;
    }
    uploadFile(file);
  };

  const uploadFile = (file) => {
    setUploading(true);
    setProgress(0);
    const formData = new FormData();
    formData.append('movie', file);
    const xhr = new window.XMLHttpRequest();
    xhr.open('POST', UPLOAD_URL);
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded * 100) / e.total));
      }
    });
    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        try {
          const res = JSON.parse(xhr.responseText);
          setMessage('Upload successful!');
          setUploadedFilename(res.filename);
        } catch {
          setMessage('Upload successful, but could not parse response.');
        }
      } else {
        setMessage('Upload failed.');
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setMessage('Upload failed.');
    };
    xhr.send(formData);
  };

  return (
    <div>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: dragActive ? '2px solid #00bfff' : '2px dashed #888',
          borderRadius: 12,
          padding: 40,
          background: dragActive ? '#232b3a' : '#222',
          textAlign: 'center',
          transition: 'border 0.2s, background 0.2s',
          marginBottom: 24,
          width: 400,
          maxWidth: '90vw',
          cursor: 'pointer',
        }}
        onClick={() => inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4"
          style={{ display: 'none' }}
          onChange={handleChange}
        />
        <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>
          Drag & Drop your .mp4 movie here
        </div>
        <div style={{ fontSize: 16, color: '#aaa' }}>
          or click to select a file
        </div>
      </div>
      {uploading && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ width: 400, maxWidth: '90vw', background: '#333', borderRadius: 8, overflow: 'hidden', margin: '0 auto' }}>
            <div style={{ width: `${progress}%`, background: '#00bfff', height: 12, transition: 'width 0.2s' }} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 6 }}>{progress}%</div>
        </div>
      )}
      {message && (
        <div style={{ color: message.includes('success') ? '#0f0' : '#f55', textAlign: 'center', marginTop: 8 }}>{message}</div>
      )}
      {uploadedFilename && (
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 12 }}>Preview Uploaded Movie</h2>
          <video
            src={`${SERVER_URL}/movie/${uploadedFilename}`}
            controls
            style={{ width: 400, maxWidth: '90vw', borderRadius: 12, background: '#000' }}
          />
        </div>
      )}
    </div>
  );
} 