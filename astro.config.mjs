// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://i-hydraulik.pl',
  trailingSlash: 'never',
  redirects: {
    '/poradnik/deski-sedesowa-ktora-rusza-sie-bielany': '/poradnik/naprawa-ruszajacej-sie-deski-sedesowej',
  },
  integrations: [sitemap({ filter: (page) => !page.includes('/nowyx') })],
});
