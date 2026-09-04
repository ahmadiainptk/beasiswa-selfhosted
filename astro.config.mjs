import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ["node:async_hooks", "node:crypto", "node:buffer", "node:fs", "node:stream"],
    },
  },
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});
