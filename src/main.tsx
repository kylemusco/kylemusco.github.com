import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import App from './App';
import { startGalaxy } from './galaxy/start';

const root = document.getElementById('root');

if (!root) {
  throw new Error('The homepage is missing its React mount element.');
}

hydrateRoot(
  root,
  <StrictMode>
    <App />
  </StrictMode>,
);

const stopGalaxy = startGalaxy();
if (import.meta.hot) import.meta.hot.dispose(stopGalaxy);
