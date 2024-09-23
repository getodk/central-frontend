import { CollectionValues } from '@getodk/common/types/collections/CollectionValues';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import unpluginFonts from 'unplugin-fonts/vite';
import type { LibraryOptions } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
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

const globalSetup: string[] = [];

/**
 * @todo this is (hopefully!) temporary. Adds a delay when testing in
 * `webkit`, to help mitigate flakiness that seems to be rooted in
 * first-run timing issues (where "first" = "no Vite cache"; the issue was
 * much more consistently reproducible in a state where
 * `node_modules/.vite` is not present).
 */
const webkitFlakinessMitigations =
	BROWSER_NAME === 'webkit' && !existsSync('./node_modules/.vite/deps');

if (webkitFlakinessMitigations) {
	globalSetup.push('./tests/globalSetup/mitigate-webkit-flakiness.ts');
}

export default defineConfig(({ mode }) => {
	const isVueBundled = mode === 'demo';

	let lib: LibraryOptions | undefined;
	let external: string[];
	let globals: Record<string, string>;

	if (isVueBundled) {
		external = [];
		globals = {};
	} else {
		external = ['vue'];
		globals = { vue: 'Vue' };

		lib = {
			formats: ['es'],
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'OdkWebForms',
			fileName: 'index',
		};
	}

	return {
		base: './',
		plugins: [
			vue(),
			vueJsx(),
			cssInjectedByJsPlugin(),
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
							weights: [300],
						},
					],
				},
			}),
		],
		resolve: {
			alias: {
				'@getodk/common': resolve(__dirname, '../common/src'),
				'@': fileURLToPath(new URL('./src', import.meta.url)),
				'primevue/menuitem': 'primevue/menu',
				// With following lines, fonts byte array are copied into css file
				// Roboto fonts - don't want to copy those in our repository
				'./fonts': resolve(
					'../../node_modules/primevue-sass-theme/themes/material/material-light/standard/indigo/fonts'
				),
				// Icomoon fonts
				'/fonts': resolve('./src/assets/fonts'),
			},
		},
		build: {
			target: 'esnext',
			lib,
			rollupOptions: {
				external,
				output: {
					globals,
				},
			},
		},
		css: {
			postcss: {
				plugins: [
					/**
					 * primevue-sass-theme defines styles within a `@layer primevue { ...
					 * }`. With that approach, host applications rules have higher
					 * precedence, which could potentially override Web Forms styles in
					 * unpredictable ways. This plugin unwraps that `@layer`, replacing it
					 * with the style rules it contains.
					 */
					{
						postcssPlugin: 'unwrap-at-layer-rules',
						Once(root) {
							root.walkAtRules((rule) => {
								if (rule.name === 'layer') {
									if (rule.parent == null) {
										throw new Error('Failed to unwrap @layer: rule has no parent');
									}

									rule.parent.append(rule.nodes);
									rule.remove();
								}
							});
						},
					},
				],
			},
		},
		optimizeDeps: {
			force: true,
		},
		test: {
			browser: {
				enabled: BROWSER_ENABLED,
				name: BROWSER_NAME!,
				provider: 'playwright',
				fileParallelism: false,
				headless: true,
				screenshotFailures: false,
			},
			environment: TEST_ENVIRONMENT,
			exclude: ['e2e/**'],
			root: fileURLToPath(new URL('./', import.meta.url)),

			/** @see {@link webkitFlakinessMitigations} */
			globalSetup,

			// Suppress the console error log about parsing CSS stylesheet
			// This is an open issue of jsdom
			// see primefaces/primevue#4512 and jsdom/jsdom#2177
			onConsoleLog(log: string, type: 'stderr' | 'stdout'): false | void {
				if (log.includes('Error: Could not parse CSS stylesheet') && type === 'stderr') {
					return false;
				}
			},
		},
	};
});
