<script setup lang="ts">
import type { SelectNode } from '@getodk/xforms-engine';
import Select from 'primevue/select';
import { computed, inject } from 'vue';
import MarkdownBlock from './MarkdownBlock.vue';
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import type { VirtualScrollerScrollIndexChangeEvent } from 'primevue';

interface SearchableDropdownProps {
	readonly question: SelectNode;
	readonly style?: string;
}

const t: Translate = inject(TRANSLATE)!;
const props = defineProps<SearchableDropdownProps>();

const INITIAL_PAGE_SIZE = 20;
const DEFAULT_PRIMEVUE_ITEM_HEIGHT = 38;

defineEmits(['update:modelValue', 'change']);

const options = computed(() => {
	return props.question.currentState.valueOptions.map((option, i) => {
		if (i < INITIAL_PAGE_SIZE) {
			return {
				value: option.value,
				label: option.label.formatted,
				search: option.label.asString,
				loaded: true
			};
		}
		return {
			value: option.value,
			loaded: false
		};
	});
});

const handleLazyLoad = (params: VirtualScrollerScrollIndexChangeEvent) => {
	const { first, last } = params;
	for (let i = first; i < last; i++) {
		const placeholder = options.value[i];
		if (!placeholder?.value || placeholder.loaded) {
			continue;
		}
		const option = props.question.getValueOption(placeholder.value);
		if (!option) {
			// should never happen, but handle gracefully if it does
			continue;
		}
		options.value[i] = {
			value: option.value,
			label: option.label.formatted,
			search: option.label.asString,
			loaded: true
		};
	}
};

const virtualScrollerOptions = computed(() => {
	const isJSDOM = typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom');
	if (isJSDOM) {
		return;
	}
	return {
		lazy: true,
		onLazyLoad: handleLazyLoad,
		itemSize: DEFAULT_PRIMEVUE_ITEM_HEIGHT,
		showLoader: true
	};
});

const selectedLabel = computed(() => {
	const value = props.question.currentState?.value?.[0];
	if (!value) {
		return [];
	}
	const option = props.question.getValueOption(value);
	return option?.label.formatted;
});

const selectValue = (value: string) => {
	props.question.selectValue(value);
};
</script>

<template>
	<Select
		:id="question.nodeId"
		class="dropdown"
		:filter="question.appearances.autocomplete"
		filter-match-mode="contains"
		:auto-filter-focus="true"
		:model-value="question.currentState.value[0]"
		:disabled="props.question.currentState.readonly"
		:options="options"
		option-label="search"
		option-value="value"
		:virtual-scroller-options="virtualScrollerOptions"
		@update:model-value="selectValue"
		@change="$emit('change')"
	>
		<template #option="slotProps">
			<MarkdownBlock v-for="elem in slotProps.option.label" :key="elem.id" :elem="elem" />
		</template>
		<template #value>
			<span v-if="!selectedLabel?.length" class="dropdown-placeholder">
				{{ t('searchable_dropdown.select.placeholder') }}
			</span>
			<MarkdownBlock v-for="elem in selectedLabel" :key="elem.id" :elem="elem" />
		</template>
	</Select>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;
@use '../../assets/styles/select-options';

.dropdown {
	width: 100%;
	border-radius: var(--odk-radius);
	border-color: var(--odk-border-color);

	&:not(.p-disabled):hover {
		border-color: var(--odk-primary-border-color);
	}

	@media screen and (min-width: #{pf.$md}) {
		width: 50%;
	}
}
</style>
