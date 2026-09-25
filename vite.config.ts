import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import App from './src/App.tsx';

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
            renderToString(createElement(App)),
          );
        },
      },
    },
  ],
  server: { strictPort: true },
  preview: { strictPort: true },
});
