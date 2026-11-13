<script setup lang="ts">
import {
	BASE_LAYER_IDS,
	type BaseLayerId,
} from '@getodk/web-forms/components/common/map/base-layers.ts';
import { TRANSLATE } from '@getodk/web-forms/lib/constants/injection-keys.ts';
import type { Translate } from '@getodk/web-forms/lib/locale/useLocale.ts';
import { inject } from 'vue';

defineProps<{ activeLayerId: BaseLayerId }>();

const emit = defineEmits<{ selectBaseLayer: [layerId: BaseLayerId] }>();
const t: Translate = inject(TRANSLATE)!;

const BASE_LAYER_OPTIONS = [
	{ id: BASE_LAYER_IDS.ROADMAP, labelKey: 'map_base_layer_picker.roadmap.label' },
	{ id: BASE_LAYER_IDS.SATELLITE, labelKey: 'map_base_layer_picker.satellite.label' },
	{ id: BASE_LAYER_IDS.TERRAIN, labelKey: 'map_base_layer_picker.terrain.label' },
] as const;
</script>

<template>
	<div class="base-layer-options" role="group">
		<button
			v-for="option in BASE_LAYER_OPTIONS"
			:key="option.id"
			type="button"
			:aria-pressed="option.id === activeLayerId"
			class="base-layer-option"
			:class="{ active: option.id === activeLayerId }"
			@click="emit('selectBaseLayer', option.id)"
		>
			{{ t(option.labelKey) }}
		</button>
	</div>
</template>

<style scoped lang="scss">
.base-layer-options {
	display: flex;
	flex-direction: column;
	gap: var(--odk-spacing-s);
	width: max-content;
	padding: var(--odk-spacing-s);
	background: var(--odk-base-background-color);
	border: 1px solid var(--odk-border-color);
	border-radius: var(--odk-radius);
}

.base-layer-option {
	padding: var(--odk-spacing-s) var(--odk-spacing-m);
	border: none;
	border-radius: var(--odk-radius);
	background: none;
	color: var(--odk-text-color);
	font-size: inherit;
	text-align: left;
	cursor: pointer;

	&:hover,
	&:focus-visible,
	&.active {
		background-color: var(--odk-primary-lighter-background-color);
	}
}
</style>
