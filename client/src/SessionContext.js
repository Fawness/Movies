import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const SERVER_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SERVER_URL) || 'http://localhost:3001';
const WS_URL = SERVER_URL.replace(/^http/, 'ws');

const SessionContext = createContext();

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [hostState, setHostState] = useState(null);
  const wsRef = useRef();

  useEffect(() => {
    const ws = new window.WebSocket(WS_URL);
    wsRef.current = ws;
    window._ws = ws;
    ws.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data.type === 'welcome') {
        setUser(data.user);
        setRole(data.user.role);
        setUsers(data.users);
        setHostState(data.hostState);
      }
      if (data.type === 'user_list') setUsers(data.users);
      if (data.type === 'host_state') setHostState(data.state);
      if (data.type === 'host_promote') setRole('host');
    };
    ws.onclose = () => {
      // Optionally handle disconnect
    };
    return () => ws.close();
  }, []);

  const sendMessage = (msg) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  const setHostStateAndBroadcast = (state) => {
    setHostState(state);
    sendMessage({ type: 'host_state', state });
  };

  return (
    <SessionContext.Provider value={{ user, role, users, hostState, sendMessage, setHostState: setHostStateAndBroadcast }}>
      {children}
    </SessionContext.Provider>
  );
} 