import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import Profile from './src/Profile.tsx';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'prerender-profile',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          return html.replace(
            '<!--app-html-->',
            renderToString(createElement(Profile)),
          );
        },
      },
    },
  ],
  server: { strictPort: true },
  preview: { strictPort: true },
});
