import type { CollectionValues } from '@getodk/common/types/collections/CollectionValues.ts';
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

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			browser: {
				enabled: BROWSER_ENABLED,
				name: BROWSER_NAME!,
				provider: 'playwright',
				headless: true,
			},
			environment: TEST_ENVIRONMENT,
			exclude: [...configDefaults.exclude, 'e2e/**'],
			root: fileURLToPath(new URL('./', import.meta.url)),
			// Suppress the console error log about parsing CSS stylesheet
			// This is an open issue of jsdom
			// see primefaces/primevue#4512 and jsdom/jsdom#2177
			onConsoleLog(log: string, type: 'stderr' | 'stdout'): false | void {
				if (log.startsWith('Error: Could not parse CSS stylesheet') && type === 'stderr') {
					return false;
				}
			},
		},
	})
);
