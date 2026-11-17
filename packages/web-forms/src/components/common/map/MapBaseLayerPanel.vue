<script setup lang="ts">
import {
	BASE_LAYER_IDS,
	type BaseLayerId,
} from '@getodk/web-forms/components/common/map/base-layers.ts';
import { TRANSLATE } from '@getodk/web-forms/lib/constants/injection-keys.ts';
import type { Translate } from '@getodk/web-forms/lib/locale/useLocale.ts';
import { inject, onMounted, ref } from 'vue';

defineProps<{ activeLayerId: BaseLayerId }>();

const emit = defineEmits<{ selectBaseLayer: [layerId: BaseLayerId] }>();
const t: Translate = inject(TRANSLATE)!;
const optionsList = ref<HTMLElement>();

onMounted(() => optionsList.value?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus());

const focusNeighbour = (event: KeyboardEvent, step: number) => {
	const list = event.currentTarget as HTMLElement;
	const options = [...list.querySelectorAll<HTMLElement>('li')];
	const current = options.indexOf(event.target as HTMLElement);
	options[current + step]?.focus();
};

const focusNext = (event: KeyboardEvent) => focusNeighbour(event, 1);

const focusPrevious = (event: KeyboardEvent) => focusNeighbour(event, -1);

const BASE_LAYER_OPTIONS = [
	{ id: BASE_LAYER_IDS.ROADMAP, labelKey: 'map_base_layer_picker.roadmap.label' },
	{ id: BASE_LAYER_IDS.SATELLITE, labelKey: 'map_base_layer_picker.satellite.label' },
	{ id: BASE_LAYER_IDS.TERRAIN, labelKey: 'map_base_layer_picker.terrain.label' },
] as const;
</script>

<template>
	<ul
		ref="optionsList"
		role="listbox"
		:aria-label="t('map_base_layer_picker.open.description')"
		class="base-layer-options"
		@keydown.down.prevent.stop="focusNext"
		@keydown.up.prevent.stop="focusPrevious"
	>
		<li
			v-for="option in BASE_LAYER_OPTIONS"
			:key="option.id"
			role="option"
			tabindex="0"
			:aria-selected="option.id === activeLayerId"
			:class="{ active: option.id === activeLayerId }"
			@click="emit('selectBaseLayer', option.id)"
			@keydown.enter.space.prevent="emit('selectBaseLayer', option.id)"
		>
			{{ t(option.labelKey) }}
		</li>
	</ul>
</template>

<style scoped lang="scss">
.base-layer-options {
	display: flex;
	flex-direction: column;
	gap: var(--odk-spacing-s);
	width: max-content;
	margin: 0;
	padding: var(--odk-spacing-s);
	background: var(--odk-base-background-color);
	border: 1px solid var(--odk-border-color);
	border-radius: var(--odk-radius);
	list-style: none;

	li {
		padding: 8px var(--odk-spacing-m);
		border-radius: var(--odk-radius);
		color: var(--odk-text-color);
		cursor: pointer;

		&:hover,
		&:focus-visible {
			background-color: var(--odk-muted-background-color);
		}

		&.active {
			background-color: var(--odk-primary-lighter-background-color);
		}

		&.active:hover,
		&.active:focus-visible {
			background-color: var(--odk-primary-light-background-color);
		}
	}
}
</style>
