/// <reference types="vite/client" />
/// <reference types="vitest" />

import type { CollectionValues } from '@getodk/common/types/collections/CollectionValues';
import { resolve as resolvePath } from 'node:path';
import babel from 'vite-plugin-babel';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

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

/**
 * TODO: Many integration tests concerned with datetimes currently expect a
 * fixed time zone, for hard-coded values. The time zone was also chosen
 * specifically because it does not (er, did not then, nor does presently at
 * time of writing) observe daylight saving time or any other periodic
 * change in its UTC offset.
 *
 * The hard-coded values make tests difficult to reason about. The lack of
 * testing around DST is a significant gap in test coverage.
 */
const TEST_TIME_ZONE = 'America/Phoenix';

/**
 * The locale used for formatting dates and times in all test cases.
 * This ensures consistent language and regional settings across tests.
 * Currently set to 'en-US' (American English), which affects date formats
 * (e.g., MM/DD/YYYY) and time separators.
 *
 * @constant
 * @default 'en-US'
 */
const TEST_LOCALE = 'en-US';

export default defineConfig(({ mode }) => {
	const isTest = mode === 'test';

	let timeZoneId: string | null = process.env.TZ ?? null;
	let localeId: string | null = process.env.LOCALE_ID ?? null;

	if (isTest) {
		timeZoneId = timeZoneId ?? TEST_TIME_ZONE;
		localeId = localeId ?? TEST_LOCALE;
	}

	// `expressionParser.ts` is built as a separate entry so it can be consumed
	// directly (once instantiated, with top-level await in its containin module)
	// where the same parser instance is used downstream for static analysis.
	const entries = ['./src/index.ts', './src/expressionParser.ts'];

	// Mapping entry names with path-based keys gives a more predictable output which
	// we control at the filesystem level, so the exports in package.json are stable
	// along with their paths and this config.
	const libEntry = Object.fromEntries(
		entries.map((entry) => [entry.replaceAll(/^\.\/src\/|\.ts$/g, ''), entry])
	);

	return {
		build: {
			target: 'esnext',
			minify: false,
			sourcemap: true,
			emptyOutDir: false,
			outDir: './dist',
			manifest: true,
			lib: {
				entry: libEntry,
				formats: ['es'],
			},
			rollupOptions: {
				external: ['fs', 'path'],
			},
		},
		define: {
			TZ: JSON.stringify(timeZoneId),
			LOCALE_ID: JSON.stringify(localeId),
		},
		esbuild: {
			target: 'esnext',
			format: 'esm',
		},
		optimizeDeps: {
			force: true,
		},
		plugins: [
			// Transform the BigInt polyfill (used by the Temporal polyfill) to use native
			// APIs. We can safely assume BigInt is available for our target platforms.
			babel({
				babelConfig: {
					babelrc: false,
					configFile: false,
					plugins: ['transform-jsbi-to-bigint'],
				},
			}),

			// Generate type definitions. This is somehow more reliable than directly calling tsc
			dts({
				exclude: ['test', 'vite-env.d.ts'],
				entryRoot: './src',
			}),
		].filter((plugin) => plugin != null),
		resolve: {
			alias: {
				'@getodk/common/types': resolvePath(__dirname, '../common/types'),
				'@getodk/common': resolvePath(__dirname, '../common/src'),
			},
		},
		test: {
			browser: {
				enabled: BROWSER_ENABLED,
				instances: BROWSER_NAME != null ? [{ browser: BROWSER_NAME }] : [],
				provider: 'playwright',
				headless: true,
				screenshotFailures: false,
			},
			setupFiles: ['test/setup.ts'],
			environment: TEST_ENVIRONMENT,
			globals: false,
			include: ['test/**/*.test.ts'],
			reporters: process.env.GITHUB_ACTIONS ? ['default', 'github-actions'] : 'default',
		},
	};
});
