import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Institutional Security: Global Fetch Interceptor to attach Session Token to all /api requests
const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem('vault_session_token');
  if (token) {
    const urlStr = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());
    if (urlStr.startsWith('/api') || urlStr.includes('/api/')) {
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : {}));
      if (!headers.has('x-session-token')) {
        headers.set('x-session-token', token);
      }
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return originalFetch(input, { ...init, headers });
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
