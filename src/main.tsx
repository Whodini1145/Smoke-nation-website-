import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/big-shoulders-display/700';
import '@fontsource/big-shoulders-display/800';
import '@fontsource/big-shoulders-display/900';
import '@fontsource-variable/figtree';
import './styles/app.css';
import './styles/admin.css';
import App from './App';
import { USE_FIREBASE } from './data/store';

// Connect to the live database (not used by the single-file preview).
if (USE_FIREBASE) void import('./data/firebase');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
