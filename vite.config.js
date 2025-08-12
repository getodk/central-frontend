/*
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

// eslint-disable-next-line import/no-unresolved
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'url';

// The default is es2020, but we need es2022 or later because Web Forms uses
// top-level await.
const buildTarget = 'es2022';

// Requests to forward to nginx
const proxyPaths = [
  '/v1',
  '/-',
  '/enketo-passthrough',
  '/client-config.json',
  '/version.txt'
];
const devServer = {
  // To make dev server accessible using devcontainers
  // bind it on `127.0.0.1` instead of `localhost` (default).
  // See https://github.com/vitejs/vite/issues/16522
  host: '127.0.0.1',
  port: 8989,
  proxy: Object.fromEntries(proxyPaths.map(path => [path, 'http://localhost:8686'])),
  // Because we proxy to nginx, which itself proxies to Backend and other
  // things, the dev server doesn't need to allow CORS. CORS is already limited
  // by default, but we just don't need it at all.
  cors: false
};

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    VueI18nPlugin({
      include: resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/**'),
      compositionOnly: false,
      defaultSFCLang: 'json5',
      // We install what we need in src/container.js.
      fullInstall: false,
      dropMessageCompiler: true
    })
  ],
  build: {
    target: buildTarget,
    // `false` during dev for performance reasons
    reportCompressedSize: mode === 'production',
    cssCodeSplit: false
  },
  // Not sure why this is needed in addition to build.target above and why it's
  // only an issue in development. `npm run dev` doesn't work without this.
  optimizeDeps: mode === 'development'
    ? { esbuildOptions: { target: buildTarget } }
    : {},
  server: devServer
}));
