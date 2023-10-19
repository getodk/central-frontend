/// <reference types="vitest" />
/// <reference types="vite/client" />

// TODO: share Vite config where makes sense

import suidPlugin from '@suid/vite-plugin';
import { createRequire } from 'node:module';
import { resolve as resolvePath } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import solidPlugin from 'vite-plugin-solid';
import topLevelAwait from 'vite-plugin-top-level-await';
import GithubActionsReporter from 'vitest-github-actions-reporter';
import type { CollectionValues } from './src/lib/collections/types';
import { solidVitestNoNodeLoader } from './vite/solid-vitest-no-node-loader';

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

const cwd = process.cwd();
const nodeModulesDir = resolvePath(cwd, '../../node_modules');

const WASM_PATHS = {
	ABSOLUTE: {
		TREE_SITTER: resolvePath(nodeModulesDir, 'web-tree-sitter/tree-sitter.wasm'),
		TREE_SITTER_XPATH: resolvePath(nodeModulesDir, 'tree-sitter-xpath/tree-sitter-xpath.wasm'),
	},
};

const RUNTIME_TARGET = BROWSER_ENABLED ? 'WEB' : 'NODE';

/**
 * @see notes on the same variable in the config for @odk/xpath
 */
const TEST_TIME_ZONE = 'America/Phoenix';

const require = createRequire(import.meta.url);

const VITEST_SETUP = require.resolve('./vite/vitest-setup.ts');

export default defineConfig(({ mode }) => {
	let timeZoneId: string | null = process.env.TZ ?? null;

	if (mode === 'test') {
		timeZoneId = timeZoneId ?? TEST_TIME_ZONE;
	}

	return {
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
			RUNTIME_TARGET: JSON.stringify(RUNTIME_TARGET),
			WASM_PATHS: JSON.stringify(WASM_PATHS),
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
		},
		plugins: [
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

			// TODO: do we want this here? It makes sense for a library like @odk/xpath,
			// but it's unclear if it will make sense for the web forms package.
			// command === 'build' ? noBundle() : null,

			// Necessary for @odk/xpath initialization, additional detail in its config
			topLevelAwait(),

			// Generate type definitions. This turned out to be more reliable in
			// @odk/xpath. TODO: revisit in case it makes sense to use tsc directly in
			// this package
			dts({
				exclude: ['test'],
			}),
		],

		resolve: {
			conditions: ['browser', 'development'],
		},

		server: {
			port: 8675,
		},

		test: {
			deps: {
				optimizer: {
					web: {
						// Prevent loading multiple instances of Solid
						exclude: ['solid-js'],
					},
				},
				moduleDirectories: ['node_modules', '../../node_modules'],
			},
			environment: TEST_ENVIRONMENT,
			globals: false,
			setupFiles: [VITEST_SETUP],
			transformMode: { web: [/\.[jt]sx?$/] },

			// isolate: false,
			// singleThread: true,
			// threads: false,
			// maxConcurrency: 1,
			// maxThreads: 0,

			exclude: ['e2e/**/*'],
			reporters: process.env.GITHUB_ACTIONS ? ['default', new GithubActionsReporter()] : 'default',
		},
	};
});
