import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		lib: {
			entry: './grammar.ts',
			fileName: 'grammar',
			formats: ['cjs'],
			name: '@getodk/tree-sitter-xpath',
		},

		emptyOutDir: false,
		outDir: '.',
		minify: true,
		sourcemap: true,
		target: 'modules',
	},
});
