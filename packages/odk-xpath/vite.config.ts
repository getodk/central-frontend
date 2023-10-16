/// <reference types="vitest" />
/// <reference types="vite/client" />

import { resolve as resolvePath } from 'node:path';
import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';
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

const TEST_INCLUDE =
	BROWSER_NAME === 'webkit' && 0 > 1
		? ['src/**/*.test.ts', 'test/**/*.{spec,test}.ts']
		: ['src/**/*.test.ts', 'test/index.ts'];

const cwd = process.cwd();
const nodeModulesDir = resolvePath(cwd, '../../node_modules');

const WASM_PATHS = {
	ABSOLUTE: {
		TREE_SITTER: resolvePath(nodeModulesDir, 'web-tree-sitter/tree-sitter.wasm'),
		TREE_SITTER_XPATH: resolvePath(nodeModulesDir, 'tree-sitter-xpath/tree-sitter-xpath.wasm'),
	},
};

const RUNTIME_TARGET = BROWSER_ENABLED ? 'WEB' : 'NODE';

export default defineConfig({
	build: {
		target: 'esnext',
		minify: false,
		sourcemap: true,
	},
	define: {
		// TODO: Many integration tests concerned with datetimes currently expect a
		// fixed time zone, for hard-coded values. The time zone was also chosen
		// specifically because it does not (er, did not then, nor does presently at
		// time of writing) observe daylight saving time or any other periodic
		// change in its UTC offset.
		//
		// The hard-coded values make tests difficult to reason about. The lack of
		// testing around DST is a significant gap in test coverage.
		TZ: JSON.stringify(process.env.TZ ?? 'America/Phoenix'),
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
		needsInterop: ['web-tree-sitter'],
		force: true,
	},
	plugins: [
		babel({
			babelConfig: {
				babelrc: false,
				configFile: false,
				plugins: ['transform-jsbi-to-bigint'],
			},
		}),
	],
	test: {
		browser: {
			enabled: BROWSER_ENABLED,
			name: BROWSER_NAME!,
			provider: 'playwright',
			headless: true,
		},

		environment: TEST_ENVIRONMENT,
		globals: false,
		include: TEST_INCLUDE,
		reporters: process.env.GITHUB_ACTIONS ? ['default', new GithubActionsReporter()] : 'default',
	},
});
