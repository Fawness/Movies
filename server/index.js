const express = require('express');
const http = require('http');
const cors = require('cors');
const WebSocket = require('ws');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Endpoint for uploading movie files
app.post('/upload', upload.single('movie'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    message: 'File uploaded successfully',
    filename: req.file.filename
  });
});

// Endpoint to stream the uploaded movie file
app.get('/movie/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Endpoint to list all uploaded videos
app.get('/videos', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to list files' });
    const videos = files.filter(f => f.endsWith('.mp4')).map(filename => {
      const stats = fs.statSync(path.join(uploadDir, filename));
      return {
        filename,
        uploaded: stats.mtime
      };
    });
    res.json(videos);
  });
});

// Endpoint to delete a video file
app.delete('/movie/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete file' });
    res.json({ message: 'File deleted successfully' });
  });
});

// Endpoint to rename a video file
app.patch('/movie/:filename', express.json(), (req, res) => {
  const oldPath = path.join(uploadDir, req.params.filename);
  const { newName } = req.body;
  if (!newName || typeof newName !== 'string' || !newName.endsWith('.mp4')) {
    return res.status(400).json({ error: 'Invalid new filename' });
  }
  const newPath = path.join(uploadDir, newName);
  if (!fs.existsSync(oldPath)) {
    return res.status(404).json({ error: 'Original file not found' });
  }
  if (fs.existsSync(newPath)) {
    return res.status(409).json({ error: 'A file with the new name already exists' });
  }
  fs.rename(oldPath, newPath, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to rename file' });
    res.json({ message: 'File renamed successfully', newName });
  });
});

// --- WebSocket Room Logic ---
let users = [];
let hostId = null;
let hostState = null; // { video, time, paused }
let bannedIds = new Set();
let chatMessages = [];
let nextMsgId = 1;

function broadcast(data, filterFn = null) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && (!filterFn || filterFn(client))) {
      client.send(JSON.stringify(data));
    }
  });
}

function getUserList() {
  return users.map(u => ({ id: u.id, name: u.name, role: u.role }));
}

wss.on('connection', (ws) => {
  // Prevent banned users from joining
  if (bannedIds.has(ws._socket.remoteAddress)) {
    ws.close();
    return;
  }
  // Assign a unique ID
  ws.id = Math.random().toString(36).substr(2, 9);
  ws.addr = ws._socket.remoteAddress;
  let user = { id: ws.id, name: 'User-' + ws.id.slice(-4), role: null, addr: ws.addr };

  // Determine role
  if (hostId === null) {
    user.role = 'host';
    hostId = ws.id;
  } else {
    user.role = 'client';
  }
  users.push(user);

  // Notify this user of their info and current state
  ws.send(JSON.stringify({ type: 'welcome', user, hostState, users: getUserList(), chat: chatMessages }));
  // Notify others of new user
  broadcast({ type: 'user_list', users: getUserList() });

  ws.on('message', (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch { return; }
    // Host updates playback state
    if (user.role === 'host' && data.type === 'host_state') {
      hostState = data.state;
      broadcast({ type: 'host_state', state: hostState }, c => c.id !== ws.id);
    }
    // Chat message
    if (data.type === 'chat') {
      const chatMsg = { id: nextMsgId++, from: user.name, userId: user.id, message: data.message };
      chatMessages.push(chatMsg);
      broadcast({ type: 'chat', ...chatMsg });
    }
    // Delete chat message (host only)
    if (user.role === 'host' && data.type === 'delete_message') {
      chatMessages = chatMessages.filter(m => m.id !== data.id);
      broadcast({ type: 'delete_message', id: data.id });
    }
    // Kick user (host only)
    if (user.role === 'host' && data.type === 'kick') {
      let target = users.find(u => u.id === data.id && u.id !== user.id);
      if (target) {
        let targetWs = Array.from(wss.clients).find(c => c.id === target.id);
        if (targetWs) targetWs.close();
        broadcast({ type: 'kicked', id: target.id });
      }
    }
    // Ban user (host only)
    if (user.role === 'host' && data.type === 'ban') {
      let target = users.find(u => u.id === data.id && u.id !== user.id);
      if (target) {
        bannedIds.add(target.addr);
        let targetWs = Array.from(wss.clients).find(c => c.id === target.id);
        if (targetWs) targetWs.close();
        broadcast({ type: 'banned', id: target.id });
      }
    }
    // Client requests sync
    if (user.role === 'client' && data.type === 'sync_request') {
      // Forward to host (if connected)
      let hostWs = Array.from(wss.clients).find(c => c.id === hostId);
      if (hostWs && hostWs.readyState === WebSocket.OPEN) {
        hostWs.send(JSON.stringify({ type: 'sync_request', from: user.id }));
      }
    }
    // Host responds to sync request
    if (user.role === 'host' && data.type === 'sync_response') {
      let clientWs = Array.from(wss.clients).find(c => c.id === data.to);
      if (clientWs && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'host_state', state: data.state }));
      }
    }
    // Rename user
    if (data.type === 'set_name') {
      user.name = data.name;
      broadcast({ type: 'user_list', users: getUserList() });
    }
  });

  ws.on('close', () => {
    users = users.filter(u => u.id !== ws.id);
    // If host left, assign new host
    if (ws.id === hostId) {
      hostId = null;
      hostState = null;
      // Assign new host if any clients remain
      if (users.length) {
        users[0].role = 'host';
        hostId = users[0].id;
        let hostWs = Array.from(wss.clients).find(c => c.id === hostId);
        if (hostWs && hostWs.readyState === WebSocket.OPEN) {
          hostWs.send(JSON.stringify({ type: 'host_promote' }));
        }
      }
    }
    broadcast({ type: 'user_list', users: getUserList() });
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`HTTP server listening on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
}); 