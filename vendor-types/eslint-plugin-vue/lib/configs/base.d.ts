declare module 'eslint-plugin-vue/lib/configs/base.js' {
	import type { Linter } from 'eslint';

	interface ESLintPluginVueBase extends Linter.Config {
		/**
		 * Source: `require.resolve('vue-eslint-parser')`
		 */
		readonly parser: string;

		readonly parserOptions: {
			readonly ecmaVersion: 2020;
			readonly sourceType: 'module';
		};

		readonly env: {
			readonly browser: true;
			readonly es6: true;
		};

		readonly plugins: ['vue'];

		readonly rules: Readonly<Record<`vue/${string}`, Linter.RuleEntry>>;
	}

	const config: ESLintPluginVueBase;

	export default config;
}
