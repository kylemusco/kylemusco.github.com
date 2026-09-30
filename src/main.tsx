import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import App from './App';

const root = document.getElementById('root');

if (!root) {
  throw new Error('The homepage is missing its React mount element.');
}

const app = hydrateRoot(
  root,
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.hot) import.meta.hot.dispose(() => app.unmount());
