/// <reference types="vitest" />
/// <reference types="vite/client" />

// TODO: share Vite config where makes sense

import type { CollectionValues } from '@odk/common/types/collections/CollectionValues.ts';
import suidPlugin from '@suid/vite-plugin';
import { createRequire } from 'node:module';
import { resolve as resolvePath } from 'node:path';
import unpluginFonts from 'unplugin-fonts/vite';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import solidPlugin from 'vite-plugin-solid';
import GithubActionsReporter from 'vitest-github-actions-reporter';
import { solidVitestNoNodeLoader } from './tools/vite/solid-vitest-no-node-loader';

export default defineConfig(({ mode }) => {
	const isTest = mode === 'test';
	const supportedBrowsers = new Set(['chromium', 'firefox', 'webkit'] as const);

	type SupportedBrowser = CollectionValues<typeof supportedBrowsers>;

	const isSupportedBrowser = (browserName: string): browserName is SupportedBrowser =>
		supportedBrowsers.has(browserName as SupportedBrowser);

	const BROWSER_NAME = (() => {
		if (!isTest) {
			return false;
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
	 * @see notes on the same variable in the config for @odk/xpath
	 */
	const TEST_TIME_ZONE = 'America/Phoenix';

	const require = createRequire(import.meta.url);

	const VITEST_SETUP = require.resolve('./tools/vite/vitest-setup.ts');

	let timeZoneId: string | null = process.env.TZ ?? null;

	if (mode === 'test') {
		timeZoneId = timeZoneId ?? TEST_TIME_ZONE;
	}

	return {
		assetsInclude: [
			'assets/**/*',
			'fixtures/**/*.xml',
			'../../node_modules/web-tree-sitter/tree-sitter.wasm',
			'../../node_modules/tree-sitter-xpath/tree-sitter-xpath.wasm',
		],
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
			sourcemap: true,
			target: 'esnext',
		},
		optimizeDeps: {
			esbuildOptions: {
				target: 'esnext',
			},
			include: BROWSER_ENABLED
				? [
						'@testing-library/dom',
						'@testing-library/jest-dom',
						'@testing-library/jest-dom/matchers',
						'loupe',
				  ]
				: [],
			entries: isTest ? ['./index.html', './tools/vite/vitest-setup.ts'] : ['./index.html'],
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

			// See JSDoc notes on plugin
			solidVitestNoNodeLoader,

			// Generate type definitions. This turned out to be more reliable in
			// @odk/xpath. TODO: revisit in case it makes sense to use tsc directly in
			// this package
			dts({
				exclude: ['test', 'tools', 'vite-env.d.ts'],
				entryRoot: './src',
			}),
		],

		resolve: {
			alias: {
				'@odk/common/types': resolvePath(__dirname, '../common/types'),
				'@odk/common': resolvePath(__dirname, '../common/src'),
				'@solidjs/testing-library': require.resolve('./tools/@solidjs/testing-library/index.ts'),
			},

			conditions: ['browser', 'development'],
		},

		server: {
			port: 8675,
		},

		test: {
			browser: {
				enabled: BROWSER_ENABLED,
				name: BROWSER_NAME!,
				provider: 'playwright',
				headless: true,
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
			setupFiles: [VITEST_SETUP],
			transformMode: { web: [/\.[jt]sx?$/] },

			exclude: ['e2e/**/*'],
			reporters: process.env.GITHUB_ACTIONS ? ['default', new GithubActionsReporter()] : 'default',
		},
	};
});
