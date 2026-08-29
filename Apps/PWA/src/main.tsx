import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Register PWA service worker with auto-update capability
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New PWA update available. Reload now?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('[PWA] App is cached and ready to work offline.');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
