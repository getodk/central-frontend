import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    root: fileURLToPath(new URL('./', import.meta.url)),
    include: ['test/**/*.spec.js'],
    browser: {
      enabled: true,
      name: 'chrome',
      headless: true,
      providerOptions: {
        capabilities: {
          // This is the size of the entire browser window. The size of the
          // viewport is smaller and is set using window.resizeTo() in
          // test/setup/iframe.js.
          'goog:chromeOptions': { args: ['window-size=2000,2000'] }
        }
      },
      fileParallelism: false,
      isolate: false,
      testerScripts: [{ src: 'test/setup/index.js', async: false }]
    },
    // I'm not sure whether `fileParallelism` and `isolate` are needed here
    // given that we also specify them under `browser` above.
    fileParallelism: false,
    isolate: false,
    sequence: { hooks: 'list' },
    globals: true
  },
  resolve: {
    // I think this is needed to compile templates in testing. Most tests import
    // .vue files, but some specify template strings.
    alias: { vue: 'vue/dist/vue.esm-bundler.js' }
  },
  server: {
    // Some tests reference this number. This is the port we used with Karma
    // before moving to Vitest.
    port: 9876
  }
}));
