/// <reference types="vitest" />
/// <reference types="vite/client" />
import { readFile } from 'node:fs/promises';
// import { defineConfig } from 'vite';

const wasmURL = async (path: string) => {
	const file = await readFile(path);
	const base64 = Buffer.from(file).toString('base64');

	return `data:application/wasm;base64,${base64}`;
};

import { defineConfig } from 'vite';

const BROWSER_ENABLED = true;

export default defineConfig(async () => {
	const treeSitterWasmURL = await wasmURL('../../node_modules/web-tree-sitter/tree-sitter.wasm');
	const treeSitterXPathWasmURL = await wasmURL('../../node_modules/tree-sitter-xpath/tree-sitter-xpath.wasm');

	return {
		assetsInclude: [
			'assets/**/*',
		],
		build: {
			target: 'esnext',
			sourcemap: true,
		},
		define: {
			TZ: JSON.stringify(process.env.TZ ?? 'America/Phoenix'),
			TREE_SITTER_WASM_URL: JSON.stringify(treeSitterWasmURL),
			TREE_SITTER_XPATH_WASM_URL: JSON.stringify(treeSitterXPathWasmURL),
		},
		esbuild: {
			sourcemap: true,
			supported: {
				using: true,
			},
			target: 'esnext',
		},
		optimizeDeps: {
			esbuildOptions: {
				supported: {
					using: true,
				},
				target: 'esnext',
			},
			needsInterop: ['lodash'],

			force: true,
		},
		resolve: {
			alias: {
				'/tree-sitter-xpath.wasm': '/node_modules/tree-sitter-xpath/tree-sitter-xpath.wasm',
			},
			conditions: ['development', 'browser'],
		},
		server: {
			port: 3000,
		},
		test: {
			browser: {
				enabled: BROWSER_ENABLED,
				name: 'chromium',
				// name: 'firefox',
				// name: 'webkit',
				provider: 'playwright',
				headless: true,
			},

			globals: true,
			deps: { registerNodeLoader: !BROWSER_ENABLED },

			include: [
				'src/**/*.test.ts',
				'test/**/*.spec.ts',
				'test/integration/**/*.test.ts',
			],
		},
	};
});
