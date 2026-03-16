import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
      define: {
        // En Vercel no hay process.env nativo en el navegador, 
        // Vite reemplaza estas cadenas por el valor literal.
        // Soporta tanto VITE_ como nombres estándar de Vercel.
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
        'process.env.DB_ENABLED': JSON.stringify(env.DB_ENABLED || env.VITE_DB_ENABLED || process.env.DB_ENABLED || 'false'),
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''),
        'process.env.SUPABASE_KEY': JSON.stringify(env.SUPABASE_KEY || env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY || ''),
      },
      build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor': ['react', 'react-dom'],
              'charts': ['recharts'],
              'supabase': ['@supabase/supabase-js'],
              'ai-engine': ['@google/generative-ai']
            }
          }
        }
      }
    };
});
