import { CollectionValues } from '@getodk/common/types/collections/CollectionValues';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import type { LibraryOptions, PluginOption } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { defineConfig } from 'vitest/config';

const currentVersion = execSync(
	'git describe --tags --dirty --always --match "@getodk/web-forms*" | cut -d "@" -f 3',
	{ encoding: 'utf-8' }
).trim();

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

const copyConfigFile = viteStaticCopy({
	targets: [
		{
			src: 'src/demo/config.json',
			dest: '', // root
		},
	],
});

export default defineConfig(({ mode }) => {
	const isVueBundled = mode === 'demo';
	const isDev = mode === 'development';

	let lib: LibraryOptions | undefined;
	let external: string[];
	let globals: Record<string, string>;
	const extraPlugins: PluginOption[] = [];

	if (isVueBundled) {
		external = [];
		globals = {};
		extraPlugins.push(copyConfigFile);
	} else {
		external = ['vue'];
		globals = { vue: 'Vue' };

		if (isDev) {
			extraPlugins.push(copyConfigFile);
		}

		lib = {
			formats: ['es'],
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'OdkWebForms',
			fileName: 'index',
		};
	}

	return {
		define: {
			__WEB_FORMS_VERSION__: `"v${currentVersion}"`,
		},
		base: './',
		plugins: [vue(), vueJsx(), cssInjectedByJsPlugin(), ...extraPlugins],
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
			/**
			 * Prevent bundling XForm fixture assets as inlined `data:` URLs.
			 *
			 * Per Vite's documentation, returning `false` opts out of inlining for
			 * assets with a `.xml` extension; for all other assets, we do not return
			 * a value, deferring to Vite's default behavior. We'll generally want the
			 * default behavior, but this comment should serve as a breadcrumb if we
			 * need to reconsider that assumption.
			 *
			 * @see
			 * {@link https://vite.dev/config/build-options.html#build-assetsinlinelimit}
			 */
			assetsInlineLimit: (filePath) => {
				// Prevent inlining XML form fixture assets as `data:` URLs.
				if (filePath.endsWith('.xml')) {
					return false;
				}

				// Per Vite docs
			},
			lib,
			rollupOptions: {
				external,
				output: {
					globals,
				},
			},
		},
		css: {
			preprocessorOptions: {
				scss: {
					api: 'modern',
				},
			},
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
			/**
			 * Linked dependencies outside the local node_modules (e.g., hoisted to the monorepo root)
			 * are not pre-bundled unless explicitly configured.
			 */
			include: ['vue'],
			entries: [resolve(__dirname, '../../node_modules/vue/dist/vue.esm-bundler.js')],
		},
		test: {
			browser: {
				enabled: BROWSER_ENABLED,
				instances: BROWSER_NAME != null ? [{ browser: BROWSER_NAME }] : [],
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
