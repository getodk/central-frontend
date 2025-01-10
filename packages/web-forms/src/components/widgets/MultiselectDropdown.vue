<script lang="ts" setup>
import type { SelectItem, SelectNode } from '@getodk/xforms-engine';
import PrimeMultiSelect from 'primevue/multiselect';

interface MultiselectDropdownProps {
	readonly question: SelectNode;
	readonly style?: string;
}

const props = defineProps<MultiselectDropdownProps>();

defineEmits(['update:modelValue', 'change']);

const selectItems = (items: SelectItem[]) => {
	const value = items.map((item) => item.value);

	props.question.selectValues(value);
};

const getOptionLabel = (item: SelectItem) => {
	return item.label.asString;
};

let panelClass = 'multi-select-dropdown-panel';
if (props.question.appearances['no-buttons']) {
	panelClass += ' no-buttons';
}
</script>

<template>
	<PrimeMultiSelect
		:id="`${question.nodeId}-control`"
		class="multi-select-dropdown"
		:input-id="question.nodeId"
		:filter="question.appearances.autocomplete"
		:auto-filter-focus="true"
		:show-toggle-all="false"
		:options="question.currentState.valueOptions"
		:option-label="getOptionLabel"
		:panel-class="panelClass"
		:model-value="question.currentState.value"
		@update:model-value="selectItems"
		@change="$emit('change')"
	/>
</template>

<style scoped lang="scss">
@import 'primeflex/core/_variables.scss';

.multi-select-dropdown {
	width: 100%;
	border-radius: 10px;
	border-color: var(--surface-300);
	border-radius: 10px;

	&:not(.p-disabled):hover {
		border-color: var(--primary-500);
	}

	@media screen and (min-width: #{$md}) {
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
		margin-left: -20px;
	}

	.p-multiselect-item {
		&[aria-selected='true']::after {
			content: '\e916';
			font-family: 'owf-icomoon';
			color: var(--primary-500);
		}

		span {
			flex: 1;
		}
	}
}
</style>
