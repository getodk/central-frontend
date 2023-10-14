declare module '@eslint/eslintrc' {
	import type { Linter } from 'eslint';

	interface FlatCompatOptions {
		readonly baseDirectory: string;
		readonly resolvePluginsRelativeTo?: string;
		readonly recommendedConfig?: Linter.BaseConfig;
		readonly allConfig?: Linter.BaseConfig;
	}

	export class FlatCompat {
		constructor(options: FlatCompatOptions);

		config(eslintrcConfig: Linter.Config): Linter.FlatConfig[];
	}
}
