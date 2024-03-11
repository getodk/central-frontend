/// <reference types="vitest" />

import type { PluginOption, UserConfig } from 'vite';
import type { UserConfig as VitestConfig } from 'vitest/config';

/**
 * Prevents Vitest usage of
 * {@link https://nodejs.org/docs/latest-v18.x/api/esm.html#loaders | `--experimental-node-loader` flag}.
 * This is a (hopefully temporary) workaround for the default behavior of
 * {@link import('vite-plugin-solid') | Solid's Vite plugin}, which hard-codes
 * `registerNodeLoader` in test mode. As such, this plugin should be loaded
 * *after* that one.
 */
export const solidVitestNoNodeLoader: PluginOption = {
	name: 'solid-vitest-no-node-loader',
	config(config): UserConfig {
		const baseConfig = config;
		return {
			...baseConfig,
			test: {
				...baseConfig.test,
				deps: {
					...baseConfig.test?.deps,
					registerNodeLoader: false,
				},
			} as VitestConfig['test'],
		} as UserConfig;
	},
};
