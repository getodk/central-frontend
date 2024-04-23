import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'path';
import type { Root } from 'postcss';
import { defineConfig } from 'vite';

// PrimeVue-Sass-Theme defines all rules under @layer primevue
// With that approach host applications rules override everything
// So we are removing @layer at build/serve time here
const removeCssLayer = () => {
	return {
		postcssPlugin: 'replace-john-with-jane',
		Once(root: Root) {
			root.walkAtRules((rule) => {
				if (rule.name === 'layer') {
					rule.parent!.append(rule.nodes);
					rule.remove();
				}
			});
		},
	};
};
removeCssLayer.postcss = true;

export default defineConfig({
	plugins: [vue(), vueJsx()],
	resolve: {
		alias: {
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
		lib: {
			formats: ['es'],
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'OdkWebForms',
			fileName: 'index',
		},
		rollupOptions: {
			external: ['vue'],
			output: {
				globals: {
					vue: 'Vue',
				},
			},
		},
	},
	css: {
		postcss: {
			plugins: [removeCssLayer()],
		},
	},
});
