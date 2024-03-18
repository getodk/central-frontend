/// <reference path="./base.d.ts" />

type base = typeof import('eslint-plugin-vue/lib/configs/base.js');

declare module 'eslint-plugin-vue/lib/configs/vue3-essential.js' {
	import type { Linter } from 'eslint';

	interface ESLintPluginVue3Essential extends Linter.Config {
		/**
		 * Source: `require.resolve('./base')`, i.e. this config extends
		 * {@link base}. Noted here because we intentionally discard this, and
		 * extend the base rules directly.
		 */
		readonly extends: string; // `require.resolve('./base')
		readonly rules: Readonly<Record<`vue/${string}`, Linter.RuleEntry>>;
	}

	const config: ESLintPluginVue3Essential;

	export default config;
}
