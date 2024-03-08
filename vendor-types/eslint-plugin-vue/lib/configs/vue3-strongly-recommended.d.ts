/// <reference path="./base.d.ts" />

declare module 'eslint-plugin-vue/lib/configs/vue3-strongly-recommended.js' {
	import type { Linter } from 'eslint';

	interface ESLintPluginVue3StronglyRecommended extends Linter.Config {
		readonly rules: Readonly<Record<`vue/${string}`, Linter.RuleEntry>>;
	}

	const config: ESLintPluginVue3StronglyRecommended;

	export default config;
}
