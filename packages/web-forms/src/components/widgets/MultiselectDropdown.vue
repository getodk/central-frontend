<script lang="ts" setup>
import type { SelectNode } from '@getodk/xforms-engine';
import MultiSelect from 'primevue/multiselect';
import { computed } from 'vue';

interface MultiselectDropdownProps {
	readonly question: SelectNode;
	readonly style?: string;
}

const props = defineProps<MultiselectDropdownProps>();

defineEmits(['update:modelValue', 'change']);

const options = computed(() => {
	return props.question.currentState.valueOptions.map((option) => option.value);
});

const selectValues = (values: readonly string[]) => {
	props.question.selectValues(values);
};

const getOptionLabel = (value: string) => {
	const option = props.question.getValueOption(value);

	if (option == null) {
		throw new Error(`Failed to find option for value: ${value}`);
	}

	return option.label.asString;
};

let panelClass = 'multi-select-dropdown-panel';
if (props.question.appearances['no-buttons']) {
	panelClass += ' no-buttons';
}
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
		:auto-filter-focus="question.appearances.autocomplete"
		:show-toggle-all="false"
		:options="options"
		:option-label="getOptionLabel"
		:panel-class="panelClass"
		:model-value="question.currentState.value"
		@update:model-value="selectValues"
		@change="$emit('change')"
	/>
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
			content: '\e916';
			font-family: 'owf-icomoon';
			color: var(--odk-primary-text-color);
		}

		span {
			flex: 1;
		}
	}
}
</style>
