import type { Plugin } from 'vite';

/**
 * Prevents Vitest usage of
 * {@link https://nodejs.org/docs/latest-v18.x/api/esm.html#loaders | `--experimental-node-loader` flag}.
 * This is a (hopefully temporary) workaround for the default behavior of
 * {@link import('vite-plugin-solid') | Solid's Vite plugin}, which hard-codes
 * `registerNodeLoader` in test mode. As such, this plugin should be loaded
 * *after* that one.
 */
export const solidVitestNoNodeLoader: Plugin = {
	name: 'solid-vitest-no-node-loader',
	config(config) {
		return {
			...config,
			test: {
				...config.test,
				deps: {
					...config.test?.deps,
					registerNodeLoader: false,
				},
			},
		};
	},
};
