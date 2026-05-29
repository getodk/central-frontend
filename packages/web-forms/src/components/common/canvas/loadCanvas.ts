/**
 * IMPORTANT: The dynamic imports here keep vue-konva and CanvasBlock in a separate lazy chunk.
 * Do not replace them with static imports.
 *
 * The module-level cache serialises concurrent imports. Safari returns undefined for ".default"
 * when multiple "import('./CanvasBlock.vue')" calls are in-flight simultaneously.
 */
import type { App, DefineComponent } from 'vue';
import type { CanvasMode } from '@/components/common/canvas/getModeConfig.ts';

export type CanvasBlockComponent = DefineComponent<{
	mode: CanvasMode;
	baseImageSrc?: `blob:${string}` | null;
	isDisabled?: boolean;
}>;

const cache = { promise: null as Promise<CanvasBlockComponent> | null };

export const loadCanvas = (app: App | undefined): Promise<CanvasBlockComponent> => {
	if (!app) {
		return Promise.reject(new Error('No Vue app instance available'));
	}
	cache.promise ??= (async () => {
		const { default: VueKonva } = await import('vue-konva');
		app.use(VueKonva);
		return (
			(await import('./CanvasBlock.vue')) as {
				default: CanvasBlockComponent;
			}
		).default;
	})();
	return cache.promise;
};
