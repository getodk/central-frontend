declare module '@vue/eslint-config-typescript' {
	import { Linter } from 'eslint';

	type VueParserKey = 'cjs' | 'cts' | 'js' | 'jsx' | 'mjs' | 'mts' | 'ts' | 'tsx';

	interface VueESLintConfigTypescript extends Linter.Config {
		plugins: ['@typescript-eslint'];

		parserOptions: {
			parser: Record<VueParserKey, string>;

			extraFileExtensions: ['.vue'];

			ecmaFeatures: {
				jsx: true;
			};
		};

		extends: ['plugin:@typescript-eslint/eslint-recommended'];

		overrides: Linter.ConfigOverride[];
	}

	const config: VueESLintConfigTypescript;

	export default config;
}
