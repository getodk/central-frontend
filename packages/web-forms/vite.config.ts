import { CollectionValues } from '@getodk/common/types/collections/CollectionValues';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { playwright } from '@vitest/browser-playwright';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import type { LibraryOptions, PluginOption } from 'vite';
import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

interface PackageJson {
  version?: string;
}
const { version = 'Unknown' } = JSON.parse(
  readFileSync(resolve('package.json'), 'utf-8')
) as PackageJson;

let buildNumber: string | null = null;
try {
  buildNumber = execSync('git rev-parse --short HEAD', {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  buildNumber = null;
}

const supportedBrowsers = new Set(['chromium', 'firefox', 'webkit'] as const);

type SupportedBrowser = CollectionValues<typeof supportedBrowsers>;

const isSupportedBrowser = (browserName: string): browserName is SupportedBrowser =>
  supportedBrowsers.has(browserName as SupportedBrowser);

const DEFAULT_BROWSER_NAME: SupportedBrowser = 'chromium';

const BROWSER_NAME = (() => {
  const envBrowserName = process.env.BROWSER_NAME;

  if (envBrowserName == null) {
    return DEFAULT_BROWSER_NAME;
  }

  if (isSupportedBrowser(envBrowserName)) {
    return envBrowserName;
  }

  throw new Error(`Unsupported browser: ${envBrowserName}`);
})();

const globalSetup: string[] = [];

/**
 * @todo this is (hopefully!) temporary. Adds a delay when testing in
 * `webkit`, to help mitigate flakiness that seems to be rooted in
 * first-run timing issues (where "first" = "no Vite cache"; the issue was
 * much more consistently reproducible in a state where
 * `node_modules/.vite` is not present).
 */
const webkitFlakinessMitigations =
  BROWSER_NAME === 'webkit' && !existsSync('./node_modules/.vite/deps');

if (webkitFlakinessMitigations) {
  globalSetup.push('./tests/globalSetup/mitigate-webkit-flakiness.ts');
}

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const external = ['fs', 'path', 'vue'];
  const globals = { vue: 'Vue' };
  const extraPlugins: PluginOption[] = [];
  const lib: LibraryOptions = {
    formats: ['es'],
    entry: resolve(__dirname, 'src/index.ts'),
    name: 'OdkWebForms',
    fileName: 'index',
  };

  const versionSuffix = buildNumber && isDev ? ` - ${buildNumber}` : '';

  return {
    define: {
      __WEB_FORMS_VERSION__: `"v${version}${versionSuffix}"`,
    },
    base: './',
    plugins: [vue(), vueJsx(), cssInjectedByJsPlugin(), ...extraPlugins],
    resolve: {
      alias: {
        '@getodk/common': resolve(__dirname, '../common/src'),
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@locales': fileURLToPath(new URL('./locales', import.meta.url)),
        'primevue/menuitem': 'primevue/menu',
        // With following lines, fonts byte array are copied into css file
        // Roboto fonts
        './fonts': resolve('../../node_modules/@fontsource/roboto'),
      },
    },
    build: {
      target: 'esnext',
      /**
       * Prevent bundling XForm fixture assets as inlined `data:` URLs.
       *
       * Per Vite's documentation, returning `false` opts out of inlining for
       * assets with a `.xml` extension; for all other assets, we do not return
       * a value, deferring to Vite's default behavior. We'll generally want the
       * default behavior, but this comment should serve as a breadcrumb if we
       * need to reconsider that assumption.
       *
       * @see
       * {@link https://vite.dev/config/build-options.html#build-assetsinlinelimit}
       */
      assetsInlineLimit: (filePath) => {
        // Prevent inlining XML form fixture assets as `data:` URLs.
        if (filePath.endsWith('.xml')) {
          return false;
        }

        // Per Vite docs
      },
      lib,
      rollupOptions: {
        external,
        onwarn(warning, warn) {
          if (warning.code === 'EVAL') return; // ignore eval warning for tree-sitter
          warn(warning);
        },
        output: {
          globals,
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
          quietDeps: true, // Suppress warnings from node_modules
        },
      },
    },
    optimizeDeps: {
      force: true,
      /**
       * Linked dependencies outside the local node_modules (e.g., hoisted to the monorepo root)
       * are not pre-bundled unless explicitly configured.
       */
      include: ['vue'],
      entries: [resolve(__dirname, '../../node_modules/vue/dist/vue.esm-bundler.js')],
    },
    test: {
      browser: {
        enabled: true,
        instances: [{ browser: BROWSER_NAME }],
        provider: playwright(),
        fileParallelism: false,
        headless: true,
        screenshotFailures: false,
      },
      exclude: ['e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),

      /** @see {@link webkitFlakinessMitigations} */
      globalSetup,
    },
  };
});
