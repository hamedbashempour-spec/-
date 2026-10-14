import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Clean up any lingering development service workers that cause automatic reload loops
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      const scriptUrl = registration.active?.scriptURL || registration.waiting?.scriptURL || '';
      // If a dev service worker or outdated conflicting worker exists, unregister it safely
      if (scriptUrl.includes('dev-sw') || scriptUrl.includes('@vite-plugin-pwa')) {
        registration.unregister().catch(() => {});
      }
    }
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

