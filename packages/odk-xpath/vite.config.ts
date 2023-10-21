/// <reference types="vitest" />
/// <reference types="vite/client" />

import { resolve as resolvePath } from 'node:path';
import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';
import dts from 'vite-plugin-dts';
import noBundle from 'vite-plugin-no-bundle';
import GithubActionsReporter from 'vitest-github-actions-reporter';
import type { CollectionValues } from './src/lib/collections/types';

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

export default defineConfig(({ command, mode }) => {
	let timeZoneId: string | null = process.env.TZ ?? null;

	if (mode === 'test') {
		timeZoneId = timeZoneId ?? TEST_TIME_ZONE;
	}

	let define: Record<string, string> = {
		TZ: JSON.stringify(timeZoneId),
	};

	if (mode === 'test') {
		define = {
			...define,
			RUNTIME_TARGET: JSON.stringify(RUNTIME_TARGET),
			WASM_PATHS: JSON.stringify(WASM_PATHS),
		};
	}

	return {
		build: {
			target: 'esnext',
			minify: false,
			sourcemap: true,
			emptyOutDir: false,
			outDir: './dist',
			manifest: true,
			lib: {
				entry: './src/index.ts',
				formats: ['es'],
				// fileName: 'index',
			},
		},
		define,
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
			// Don't bundle library builds
			command === 'build' ? noBundle() : null,

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
				exclude: ['test'],
			}),
		].filter((plugin) => plugin != null),
		test: {
			browser: {
				enabled: BROWSER_ENABLED,
				name: BROWSER_NAME!,
				provider: 'playwright',
				headless: true,
			},

			environment: TEST_ENVIRONMENT,
			globals: false,
			include: ['src/**/*.test.ts', 'test/index.ts'],
			reporters: process.env.GITHUB_ACTIONS ? ['default', new GithubActionsReporter()] : 'default',
		},
	};
});
