<script lang="ts" setup>
import type { SelectNode } from '@getodk/xforms-engine';
import MultiSelect from 'primevue/multiselect';
import { computed } from 'vue';
import MarkdownBlock from './MarkdownBlock.vue';

interface MultiselectDropdownProps {
	readonly question: SelectNode;
	readonly style?: string;
}

const props = defineProps<MultiselectDropdownProps>();

defineEmits(['update:modelValue', 'change']);

const options = computed(() => {
	return props.question.currentState.valueOptions.map((option) => {
		const label = props.question.getValueOption(option.value);
		if (label == null) {
			throw new Error(`Failed to find option for value: ${option.value}`);
		}

		return {
			value: option.value,
			label: option.label.formatted,
			search: option.label.asString,
		};
	});
});

const selectValues = (values: readonly string[]) => {
	props.question.selectValues(values);
};

let panelClass = 'multi-select-dropdown-panel';
if (props.question.appearances['no-buttons']) {
	panelClass += ' no-buttons';
}

const selectedLabels = computed(() => {
	const state = props.question.currentState;
	return state.value.map((val) => {
		const found = state.valueOptions.find((opt) => opt.value === val);
		return found?.label.formatted;
	});
});
</script>

<template>
	<!--
		Setting 'auto-filter-focus' true when 'filter' is true, to fix autofocus exception.
		Ref: https://github.com/primefaces/primevue/issues/6793
	-->
	<MultiSelect
		:id="`${question.nodeId}-control`"
		class="multi-select-dropdown"
		:input-id="question.nodeId"
		:filter="question.appearances.autocomplete"
		filter-match-mode="contains"
		:auto-filter-focus="question.appearances.autocomplete"
		:show-toggle-all="false"
		:disabled="props.question.currentState.readonly"
		:options="options"
		option-value="value"
		option-label="search"
		:panel-class="panelClass"
		:model-value="question.currentState.value"
		@update:model-value="selectValues"
		@change="$emit('change')"
	>
		<template #option="slotProps">
			<MarkdownBlock v-for="(elem, index) in slotProps.option.label" :key="index" :elem="elem" />
		</template>
		<template #value>
			<template v-for="(markdown, index) in selectedLabels" :key="index">
				<!-- eslint-disable-next-line -->
				<template v-if="index > 0">, </template>
				<MarkdownBlock v-for="(elem, j) in markdown" :key="j" :elem="elem" />
			</template>
		</template>
	</MultiSelect>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.multi-select-dropdown {
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

<style lang="scss">
.multi-select-dropdown-panel.no-buttons {
	.p-checkbox-box {
		display: none;
	}

	.p-checkbox {
		width: 0; /* Checkbox isn't visible */
	}

	.p-multiselect-option {
		&[aria-selected='true']::after {
			content: '\2713';
			font-family: system-ui;
			color: var(--odk-primary-text-color);
		}

		span {
			flex: 1;
		}
	}
}
</style>
