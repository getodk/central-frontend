/// <reference types="vitest" />
/// <reference types="vite/client" />

// TODO: much of this may be a good candidate for sharing from this internal package!

import type { CollectionValues } from '@getodk/common/types/collections/CollectionValues.ts';
import type { VitestTestConfig } from '@getodk/common/types/vitest-config.ts';
import { defineConfig } from 'vite';

export default defineConfig(() => {
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
		esbuild: {
			sourcemap: true,
			target: 'esnext',
		},
		optimizeDeps: {
			esbuildOptions: {
				target: 'esnext',
			},
			force: true,
		},
		test: {
			browser: {
				enabled: BROWSER_ENABLED,
				name: BROWSER_NAME!,
				provider: 'playwright',
				headless: true,
				screenshotFailures: false,
			},

			deps: {
				optimizer: {
					web: {
						// Prevent loading multiple instances of Solid. This deviates from
						// most of the recommendations provided by Solid and related tooling,
						// as Vitest's interfaces have since changed. But it does seem to be
						// the appropriate solution (at least for our usage).
						exclude: ['solid-js'],
					},
				},
				moduleDirectories: ['node_modules', '../../node_modules'],
			},
			environment: TEST_ENVIRONMENT,
			globals: false,

			exclude: ['e2e/**/*'],
			reporters: process.env.GITHUB_ACTIONS ? ['default', 'github-actions'] : 'default',
		} satisfies VitestTestConfig,
	};
});
