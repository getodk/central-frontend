/// <reference types="vitest" />
/// <reference types="vite/client" />

// TODO: share Vite config where makes sense

import type { CollectionValues } from '@getodk/common/types/collections/CollectionValues.ts';
import type { VitestTestConfig } from '@getodk/common/types/vitest-config.ts';
import suidPlugin from '@suid/vite-plugin';
import { resolve as resolvePath } from 'node:path';
import unpluginFonts from 'unplugin-fonts/vite';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig(({ mode }) => {
	const isDev = mode === 'development';
	const isTest = mode === 'test';
	const supportedBrowsers = new Set(['chromium', 'firefox', 'webkit'] as const);

	type SupportedBrowser = CollectionValues<typeof supportedBrowsers>;

	const isSupportedBrowser = (browserName: string): browserName is SupportedBrowser =>
		supportedBrowsers.has(browserName as SupportedBrowser);

	const BROWSER_NAME = (() => {
		if (!isTest) {
			return null;
		}

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
	 * @see notes on the same variable in the config for @getodk/xpath
	 */
	const TEST_TIME_ZONE = 'America/Phoenix';

	let timeZoneId: string | null = process.env.TZ ?? null;

	if (mode === 'test') {
		timeZoneId = timeZoneId ?? TEST_TIME_ZONE;
	}

	let devAliases: Record<string, string> = {};

	if (isDev) {
		devAliases = {
			'@getodk/xforms-engine': resolvePath(__dirname, '../xforms-engine/src/index.ts'),
		};
	}

	return {
		assetsInclude: ['assets/**/*', 'fixtures/**/*.xml'],
		build: {
			target: 'esnext',
			minify: false,
			sourcemap: true,
			emptyOutDir: false,
			outDir: './dist',
			manifest: true,
		},
		define: {
			TZ: JSON.stringify(timeZoneId),
		},
		esbuild: {
			target: 'esnext',
		},
		optimizeDeps: {
			esbuildOptions: {
				target: 'esnext',
			},
			entries: ['./index.html'],
			include: ['@getodk/xpath'],
			force: true,
		},
		plugins: [
			unpluginFonts({
				fontsource: {
					families: [
						{
							/**
							 * Name of the font family.
							 * Require the `@fontsource/roboto` package to be installed.
							 */
							name: 'Roboto',
							/**
							 * Load only a subset of the font family.
							 */
							weights: [400, 500, 700],
						},
					],
				},
			}),

			// SUID = Solid MUI component library
			suidPlugin(),

			// Solid's JSX transform (dom-expressions), optimizes DOM access in components
			solidPlugin({
				babel: {
					babelrc: false,
					configFile: false,

					// Transform the BigInt polyfill (used by the Temporal polyfill) to use native
					// APIs. We can safely assume BigInt is available for our target platforms.
					plugins: ['transform-jsbi-to-bigint'],
				},
			}),

			// Generate type definitions. This turned out to be more reliable in
			// @getodk/xpath. TODO: revisit in case it makes sense to use tsc directly
			// in this package
			dts({
				exclude: ['test'],
				entryRoot: './src',
				tsconfigPath: './tsconfig.json',
			}),
		],

		resolve: {
			alias: {
				'@getodk/common/types': resolvePath(__dirname, '../common/types'),
				'@getodk/common': resolvePath(__dirname, '../common/src'),

				// For (temporary?) dev convenience, alias `@getodk/xforms-engine` to
				// its source so changes to the engine can be watched in
				// `@getodk/ui-solid` dev mode.
				...devAliases,
			},

			conditions: ['solid', 'browser', 'development'],
		},

		server: BROWSER_ENABLED
			? {}
			: {
					port: 8675,
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
					ssr: {
						exclude: ['solid-js'],
					},
					web: {
						// Prevent loading multiple instances of Solid. This deviates from
						// most of the recommendations provided by Solid and related
						// tooling, as Vitest's interfaces have since changed. But it does
						// seem to be the appropriate solution (at least for our usage).
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
