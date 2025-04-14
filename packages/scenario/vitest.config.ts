/// <reference types="vitest" />
/// <reference types="vite/client" />

import type { CollectionValues } from '@getodk/common/types/collections/CollectionValues.ts';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
	let include: string[];
	let exclude: string[];

	const isBenchmark = mode === 'benchmark';

	if (isBenchmark) {
		include = ['./benchmark/**/*.bench.ts'];
		exclude = ['./src/**/*', './test/**/*'];
	} else {
		include = ['./test/**/*.test.ts'];
		exclude = ['./src/**/*', './benchmark/**/*'];
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

	const BROWSER_ENABLED = BROWSER_NAME != null;
	const TEST_ENVIRONMENT = BROWSER_ENABLED ? 'node' : 'jsdom';

	return {
		build: {
			target: false as const,
		},
		esbuild: {
			sourcemap: true,
			target: 'esnext',
		},
		optimizeDeps: {
			esbuildOptions: {
				target: 'esnext',
			},
			force: true,
			include: ['papaparse'],
		},
		resolve: {
			alias: {
				'@getodk/xforms-engine': resolve(__dirname, '../xforms-engine/src/index.ts'),
			},
			conditions: ['solid', 'browser', 'development'],
		},
		test: {
			browser: {
				enabled: BROWSER_ENABLED,
				instances: BROWSER_NAME != null ? [{ browser: BROWSER_NAME }] : [],
				provider: 'playwright',
				headless: true,
				screenshotFailures: false,
			},

			include,
			exclude,

			deps: {
				optimizer: {
					web: {
						// Prevent loading multiple instances of Solid.
						//
						// (Copypasta from `@getodk/common`)
						exclude: ['solid-js'],
					},
				},
				moduleDirectories: ['node_modules', '../../node_modules'],
			},
			environment: TEST_ENVIRONMENT,
			globals: false,
			setupFiles: ['./src/vitest/setup.ts'],

			reporters: process.env.GITHUB_ACTIONS ? ['default', 'github-actions'] : 'default',

			server: {
				deps: {
					/**
					 * Added to resolve a `TypeError: Cannot read properties of undefined (reading 'registerGraph')`
					 * error in `solid-js/store` during tests, which occurred because SolidJS dev tools (`DEV$1`) were not
					 * properly initialized in the `jsdom` environment when dependencies were pre-bundled.
					 *
					 * It maintains test behavior closer to a real browser runtime, avoiding pre-bundling quirks. It might
					 * increase test startup time slightly due to skipping pre-bundling optimizations.
					 */
					inline: TEST_ENVIRONMENT === 'jsdom' ? ['solid-js'] : [],
				},
			},
		},
	};
});
