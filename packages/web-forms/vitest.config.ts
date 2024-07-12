import type { CollectionValues } from '@getodk/common/types/collections/CollectionValues.ts';
import type { VitestTestConfig } from '@getodk/common/types/vitest-config.ts';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

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

const BROWSER_ENABLED = BROWSER_NAME != null;

const TEST_ENVIRONMENT = BROWSER_ENABLED ? 'node' : 'jsdom';

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

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			browser: {
				enabled: BROWSER_ENABLED,
				name: BROWSER_NAME!,
				provider: 'playwright',
				fileParallelism: false,
				headless: true,
				screenshotFailures: false,
			},
			environment: TEST_ENVIRONMENT,
			exclude: [...configDefaults.exclude, 'e2e/**'],
			root: fileURLToPath(new URL('./', import.meta.url)),

			/** @see {@link webkitFlakinessMitigations} */
			globalSetup,

			// Suppress the console error log about parsing CSS stylesheet
			// This is an open issue of jsdom
			// see primefaces/primevue#4512 and jsdom/jsdom#2177
			onConsoleLog(log: string, type: 'stderr' | 'stdout'): false | void {
				if (log.startsWith('Error: Could not parse CSS stylesheet') && type === 'stderr') {
					return false;
				}
			},
		} satisfies VitestTestConfig,
	})
);
