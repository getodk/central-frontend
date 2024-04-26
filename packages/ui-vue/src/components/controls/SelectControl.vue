<script setup lang="ts">
import type { SelectItem, SelectNode } from '@odk-web-forms/xforms-engine';
import PrimeVueCheckbox from 'primevue/checkbox';
import type { HTMLInputElementEvent } from 'primevue/events';

import PrimeVueRadioButton from 'primevue/radiobutton';
import { computed } from 'vue';
import ControlLabel from '../ControlLabel.vue';


const props = defineProps<{question: SelectNode}>();

const setSelect1Value = (item: SelectItem) => {	
	props.question.select(item);
};

const setSelectNValue = (e: HTMLInputElementEvent, item: SelectItem) => {	
	const checkbox = e.target;

	if(checkbox.checked) {
		props.question.select(item);
	}
	else{
		props.question.deselect(item);
	}	
}

const value = computed(() => {
	const [item] = props.question.currentState.value;

	return item?.value ?? null
})
</script>

<template>
	<ControlLabel :question="question" />

	<template v-if="question.definition.bodyElement.type === 'select1'">
		<div 
			v-for="option in question.currentState.valueOptions" 
			:key="option.value" 
			:class="[{disabled: question.currentState.readonly}, 'select1']"
		>
			<PrimeVueRadioButton 
				:input-id="question.nodeId + '_' + option.value" 
				:name="question.nodeId"
				:value="option.value"
				:disabled="question.currentState.readonly"
				:model-value="value" 
				@update:model-value="setSelect1Value(option)"
			/>
			<label :for="question.nodeId + '_' + option.value">{{ option.label?.asString }}</label>
		</div>
	</template>
  
	<template v-else>
		<div 
			v-for="option of question.currentState.valueOptions" 
			:key="option.value"
			:class="[{disabled: question.currentState.readonly}, 'selectN']"
		>
			<PrimeVueCheckbox 
				:input-id="question.nodeId + '_' + option.value" 
				:name="question.nodeId"
				:value="option.value" 
				:disabled="question.currentState.readonly"
				:model-value="question.currentState.value.map(v => v.value)" 
				@change="setSelectNValue($event, option)"
			/>
			<label :for="question.nodeId + '_' + option.value">{{ option.label?.asString }}</label>
		</div>
	</template>
</template>