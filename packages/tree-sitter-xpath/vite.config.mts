import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
	build: {
		lib: {
			entry: './src/grammar.ts',
			fileName: 'grammar',
			formats: ['cjs'],
			name: '@getodk/tree-sitter-xpath',
		},
		emptyOutDir: true,
		outDir: './dist',
		minify: false,
		sourcemap: true,
		target: 'modules',
	},
	plugins: [
		viteStaticCopy({
			targets: [
				// Copies the top-level `tree-sitter.json` into Vite build directory,
				// which is then used by `tree-sitter`'s own build process. The
				// resulting copy is ephemeral: it is _only used for that next build
				// step_. Importantly, that means it is **not used for testing**.
				{
					src: 'tree-sitter.json',
					dest: '',
					transform: (content) => {
						// The top-level `tree-sitter.json` serves two purposes:
						//
						// 1. To produce a copy for build (as described above)
						// 2. As metadata for the `tree-sitter test` command, which needs
						//    to reference the same `grammar.js` built by this Vite config.
						//
						// This replacement ensures that both resulting `tree-siter.json`
						// files reference the same `grammar.js`.
						return content.replace('"path": "./dist",', '"path": ".",');
					},
				},
			],
		}),
	],
});
