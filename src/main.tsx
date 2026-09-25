import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './navigation.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('The homepage is missing its React mount element.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
