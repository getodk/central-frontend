/// <reference types="vite/client" />

import type { CollectionValues } from '@getodk/common/types/collections/CollectionValues';
import { resolve as resolvePath } from 'node:path';
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

export default defineConfig(({ mode }) => {
	const { VITE_BUILD_TARGET } = process.env;
	const IS_SOLID_BUILD_TARGET = VITE_BUILD_TARGET === 'solid';
	const isTest = mode === 'test';
	const entry = './src/index.ts';
	const entryKey = IS_SOLID_BUILD_TARGET ? 'solid' : 'index';
	const libEntry = {
		[entryKey]: entry,
	};

	const entries = Object.values(libEntry);

	const external = ['@getodk/common'];

	if (IS_SOLID_BUILD_TARGET) {
		external.push('solid-js', 'solid-js/store');
	}

	const dtsPlugins = IS_SOLID_BUILD_TARGET
		? []
		: [
				dts({
					entryRoot: './src',
					exclude: ['@getodk/common', 'test', 'vite-env.d.ts'],
					include: ['src/**/*.ts'],
				}),
			];

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
				name: '@getodk/xforms-engine',
				fileName(_, entryName) {
					if (entryName in libEntry) {
						return `${entryName}.js`;
					}

					return entryName.replace(/^\.src\//, '').replace(/\.ts$/, '.js');
				},
			},
			rollupOptions: { external },
		},

		esbuild: {
			target: 'esnext',
			format: 'esm',
			exclude: external,
		},

		optimizeDeps: {
			esbuildOptions: {
				target: 'esnext',
			},
			entries,
			include: ['@getodk/xpath'],
			force: true,
		},

		plugins: [...dtsPlugins],

		resolve: {
			alias: {
				'@getodk/common/types': resolvePath(__dirname, '../common/types'),
				'@getodk/common': resolvePath(__dirname, '../common/src'),
			},

			// prettier-ignore
			conditions:
				isTest
					// Without this, anything using Solid reactivity fails inexplicably...
					? ['solid', 'development', 'browser']
					: ['solid', 'import', 'browser'],
		},

		test: {
			browser: {
				enabled: BROWSER_ENABLED,
				instances: BROWSER_NAME != null ? [{ browser: BROWSER_NAME }] : [],
				provider: 'playwright',
				headless: true,
				screenshotFailures: false,
			},

			environment: TEST_ENVIRONMENT,
			globals: false,
			include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
			exclude: ['src/**/*.tsx', 'test/**/*.tsx'],
			reporters: process.env.GITHUB_ACTIONS ? ['default', 'github-actions'] : 'default',

			server: {
				deps: {
					/**
					 * Inlines all dependencies into the test bundle instead of pre-bundling them.
					 *
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
