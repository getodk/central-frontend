import { CollectionValues } from '@getodk/common/types/collections/CollectionValues';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
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

const BROWSER_NAME = (() => {
  const envBrowserName = process.env.BROWSER_NAME;

  if (envBrowserName == null) {
    return null;
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
  const isVueBundled = mode === 'demo';
  const isDev = mode === 'development';

  const versionSuffix = buildNumber && (isVueBundled || isDev) ? ` - ${buildNumber}` : '';

  return {
    define: {
      __WEB_FORMS_VERSION__: `"v${version}${versionSuffix}"`,
    },
    base: './',
    plugins: [vue(), vueJsx(), cssInjectedByJsPlugin()],
    root: 'tests/app/',

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
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
          quietDeps: true, // Suppress warnings from node_modules
        },
      },
    },
  };
});
