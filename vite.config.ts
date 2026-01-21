import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import postcssNesting from 'postcss-nesting';
import react from '@vitejs/plugin-react';
import ejsTemplatePlugin from './website/src/rollupPlugin';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        fs: {
          allow: [
            '.',
            path.resolve(__dirname, 'website'),
            path.resolve(__dirname, 'components-sdk'),
          ],
        },
      },
      plugins: [
        react(),
        ejsTemplatePlugin({
          compileDebug: mode === 'development',
        }),
      ],
      assetsInclude: ['**/*.ejs'],
      css: {
        postcss: {
          plugins: [postcssNesting],
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_BOT_TOKEN': JSON.stringify(env.VITE_BOT_TOKEN || ''),
        'window.__VITE_BOT_TOKEN__': JSON.stringify(env.VITE_BOT_TOKEN || ''),
        'window.__VITE_WEBHOOK_PROXIES__': JSON.stringify(env.VITE_WEBHOOK_PROXIES || ''),
        'window.__VITE_WEBHOOK_PROXY_MODE__': JSON.stringify(env.VITE_WEBHOOK_PROXY_MODE || ''),
        'window.__VITE_CORS_PROXY__': JSON.stringify(env.VITE_CORS_PROXY || ''),
        'window.__VITE_BACKEND_PROXY_KEY__': JSON.stringify(env.VITE_BACKEND_PROXY_KEY || ''),
        'window.__VITE_BACKEND_PROXY_BASE__': JSON.stringify(env.VITE_BACKEND_PROXY_BASE || ''),
        'window.__VITE_MESSAGE_BUILDER_API__': JSON.stringify(env.VITE_MESSAGE_BUILDER_API || ''),
        'window.__VITE_MESSAGE_BUILDER_API_KEY__': JSON.stringify(env.VITE_MESSAGE_BUILDER_API_KEY || ''),
        'import.meta.env.VITE_MESSAGE_BUILDER_API': JSON.stringify(env.VITE_MESSAGE_BUILDER_API || ''),
        'import.meta.env.VITE_MESSAGE_BUILDER_API_KEY': JSON.stringify(env.VITE_MESSAGE_BUILDER_API_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'components-sdk': path.resolve(__dirname, 'components-sdk/src'),
        }
      }
    };
});
