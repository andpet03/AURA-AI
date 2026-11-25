import { defineConfig } from 'vite';

// base './' makes the build work on GitHub Pages (/<repo>/) and anywhere else.
export default defineConfig({
  base: './',
  server: { host: true }, // lets you open the dev server from your phone on the same Wi-Fi
});
