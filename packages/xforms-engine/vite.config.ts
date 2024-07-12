/// <reference types="vite/client" />

import type { CollectionValues } from '@getodk/common/types/collections/CollectionValues';
import type { VitestTestConfig } from '@getodk/common/types/vitest-config.ts';
import { resolve as resolvePath } from 'node:path';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import type { UserConfig as VitestConfig } from 'vitest/config';

// TODO: this will hopefully be unnecessary when we update Vite/Vitest.
interface ViteConfig extends UserConfig, Pick<VitestConfig, 'test'> {}

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
				name: BROWSER_NAME!,
				provider: 'playwright',
				headless: true,
				screenshotFailures: false,
			},

			environment: TEST_ENVIRONMENT,
			globals: false,
			include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
			exclude: ['src/**/*.tsx', 'test/**/*.tsx'],
			reporters: process.env.GITHUB_ACTIONS ? ['default', 'github-actions'] : 'default',
		} satisfies VitestTestConfig,
	} satisfies ViteConfig;
});
