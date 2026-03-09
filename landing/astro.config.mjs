// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

// https://astro.build/config
const landingBase = process.env.LANDING_BASE || '/';

export default defineConfig({
  base: landingBase,

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()]
});
