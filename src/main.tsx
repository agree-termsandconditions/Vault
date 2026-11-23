import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Sync session token cookie on startup if present
try {
  const existingToken = localStorage.getItem('vault_session_token');
  if (existingToken) {
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `vault_session_token=${encodeURIComponent(existingToken)}; path=/; max-age=86400; ${isSecure ? 'SameSite=None; Secure' : 'SameSite=Lax'}`;
  }
} catch {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
