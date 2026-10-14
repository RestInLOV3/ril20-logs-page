// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  // wrangler:dev(--persist-to .wrangler)와 같은 로컬 D1/R2 데이터를 사용
  adapter: cloudflare({ persistState: { path: '.wrangler' } }),
  integrations: [react()],
  base: '/logs',
  output: 'server',
});