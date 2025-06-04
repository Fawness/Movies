# MovieSync

A browser-based app for synchronizing movie playback with friends, featuring real-time chat, user management, and host/client roles.

## Features
- Host can upload and play movies from their computer
- Clients can join to watch in sync, chat, and see who's online
- Real-time chat and user list
- Host moderation: pause, kick, ban, moderate chat
- Responsive, modern UI

## Setup

### Prerequisites
- Node.js (v16+ recommended)
- npm

### 1. Clone the repository
```
git clone https://github.com/Fawness/Movies
cd <your-repo-folder>
```

### 2. Install dependencies
```
cd server
npm install
cd ../client
npm install
```

### 3. Start the backend server
```
cd ../server
node index.js
```
- By default, the server runs on [http://localhost:3001](http://localhost:3001)

### 4. Start the frontend (React) app
```
cd ../client
npm start
```
- By default, the app runs on [http://localhost:3000](http://localhost:3000)

## Usage
- Open [http://localhost:3000](http://localhost:3000) in your browser.
- The first user to join becomes the host and can upload/select a movie.
- Open a new incognito/private window or a different browser to join as a client.
- The host controls playback; clients stay in sync and can use the resync button if needed.
- Use the chat and user list in the side panel.

## Troubleshooting
- **Port already in use:** If you see `EADDRINUSE`, stop the other process using that port or change the port in `server/index.js`.
- **Multi-user testing:** Use incognito/private windows or different browsers to simulate multiple users on the same machine.
- **Network access:** To test on other devices, use your computer's IP address (e.g., `http://192.168.x.x:3000`) and ensure your firewall allows connections.

## File Structure
- `server/` — Node.js backend (Express, WebSocket, file uploads)
- `client/` — React frontend (modern, responsive UI)

## License
MIT
