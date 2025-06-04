import React from 'react';
import UploadMovie from './UploadMovie';

function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#181c24', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontWeight: 700, marginBottom: 24 }}>Movie Host Upload</h1>
      <UploadMovie />
    </div>
  );
}

export default App;
