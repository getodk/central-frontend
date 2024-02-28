/// <reference types="vite/client" />
/// <reference types="vitest" />

import type { CollectionValues } from '@odk/common/types/collections/CollectionValues';
import { resolve as resolvePath } from 'node:path';
import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';
import dts from 'vite-plugin-dts';
import GithubActionsReporter from 'vitest-github-actions-reporter';

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

export default defineConfig(({ command, mode }) => {
	const isBuild = command === 'build';
	const isTest = mode === 'test';

	let timeZoneId: string | null = process.env.TZ ?? null;

	if (isTest) {
		timeZoneId = timeZoneId ?? TEST_TIME_ZONE;
	}

	// `TreeSitterXPathParser.ts` is built as a separate entry so it can be
	// initialized first, independently of the otherwise synchronous evaluator.
	const entries = [
		'./src/index.ts',
		'./src/static/grammar/ExpressionParser.ts',
		'./src/static/grammar/TreeSitterXPathParser.ts',
	];

	// Mapping entry names with path-based keys gives a more predictable output which
	// we control at the filesystem level, so the exports in package.json are stable
	// along with their paths and this config.
	const libEntry = Object.fromEntries(
		entries.map((entry) => [entry.replaceAll(/^\.\/src\/|\.ts$/g, ''), entry])
	);

	if (isTest) {
		entries.push('./tools/vite/vitest-setup.ts');
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
				entry: libEntry,
				formats: ['es'],
			},
			rollupOptions: {
				external: isBuild ? ['tree-sitter-xpath', 'web-tree-sitter'] : [],
			},
		},
		define: {
			TZ: JSON.stringify(timeZoneId),
		},
		esbuild: {
			sourcemap: true,
			target: 'esnext',
			format: 'esm',
		},
		optimizeDeps: {
			// Entries is also specified here so Vite will detect dependencies which
			// need to be converted to ESM. Namely: tree-sitter/tree-sitter.js, which
			// is published as an optionally-CJS module.
			//
			// TODO: investigate transforming it to ESM separately, to minimize the
			// necessity for special tooling consideration here (and downstream).
			entries,

			force: true,

			include: BROWSER_ENABLED ? ['loupe'] : [],
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
				'@odk/common/types': resolvePath(__dirname, '../common/types'),
				'@odk/common': resolvePath(__dirname, '../common/src'),
			},
		},
		test: {
			browser: {
				enabled: BROWSER_ENABLED,
				name: BROWSER_NAME!,
				provider: 'playwright',
				headless: true,
			},

			environment: TEST_ENVIRONMENT,
			globals: false,
			include: ['src/**/*.test.ts', 'test/native/index.ts', 'test/xforms/index.ts'],
			reporters: process.env.GITHUB_ACTIONS ? ['default', new GithubActionsReporter()] : 'default',
		},
	};
});
