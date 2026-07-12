// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://i-hydraulik.pl',
  trailingSlash: 'never',
  integrations: [sitemap({ filter: (page) => !page.includes('/nowyx') })],
});
