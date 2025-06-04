import React, { useRef, useState } from 'react';

const SERVER_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SERVER_URL) || 'http://localhost:3001';
const UPLOAD_URL = SERVER_URL + '/upload';

export default function UploadMovie({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
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
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList) => {
    setMessage('');
    const files = Array.from(fileList).filter(file => file.type === 'video/mp4');
    if (!files.length) {
      setMessage('Only .mp4 files are allowed.');
      return;
    }
    uploadFiles(files);
  };

  const uploadSingleFile = (file, setProgress, setMessage) => {
    return new Promise((resolve, reject) => {
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
        if (xhr.status === 200) {
          resolve();
        } else {
          setMessage('Upload failed for ' + file.name);
          reject();
        }
      };
      xhr.onerror = () => {
        setMessage('Upload failed for ' + file.name);
        reject();
      };
      xhr.send(formData);
    });
  };

  const uploadFiles = async (files) => {
    setUploading(true);
    setProgress(0);
    let uploadedCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await uploadSingleFile(file, setProgress, setMessage);
        uploadedCount++;
      } catch {}
    }
    setUploading(false);
    setProgress(0);
    setMessage(uploadedCount ? `Uploaded ${uploadedCount} file(s) successfully!` : 'No files uploaded.');
    if (uploadedCount && onUploadSuccess) onUploadSuccess();
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
          multiple
          style={{ display: 'none' }}
          onChange={handleChange}
        />
        <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>
          Drag & Drop your .mp4 movie(s) here
        </div>
        <div style={{ fontSize: 16, color: '#aaa' }}>
          or click to select file(s)
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
        <div style={{ color: message.includes('success') || message.includes('Uploaded') ? '#0f0' : '#f55', textAlign: 'center', marginTop: 8 }}>{message}</div>
      )}
    </div>
  );
} 