<script lang="ts" setup>
import type { SelectItem, SelectNode } from '@getodk/xforms-engine';
import PrimeMultiSelect from 'primevue/multiselect';

const props = defineProps<{ question: SelectNode, style?: string}>();
defineEmits(['update:modelValue']);

const setSelectNValue = (values: SelectItem[]) => {
	for(const v of props.question.currentState.value){
		props.question.deselect(v);
	}
	for(const v of values) {
		props.question.select(v);
	}
}

const getOptionLabel = (o:SelectItem) => {
	return o.label?.asString;
}

let panelClass = 'multi-select-dropdown-panel';
if(props.question.appearances['no-buttons']) {
	panelClass += ' no-buttons';
}

</script>
<template>
	<PrimeMultiSelect 
		class="multi-select-dropdown"
		:input-id="question.nodeId"
		:filter="question.appearances.autocomplete"
		:auto-filter-focus="true"
		:show-toggle-all="false"				
		:options="question.currentState.valueOptions" 
		:option-label="getOptionLabel" 
		:panel-class="panelClass"
		:model-value="question.currentState.value"		
		@update:model-value="setSelectNValue"
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
		
			&[aria-selected=true]::after {
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