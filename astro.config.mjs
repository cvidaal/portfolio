import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://www.cvidal.dev',
  integrations: [react(), mdx()],
  markdown: { syntaxHighlight: false },
});
