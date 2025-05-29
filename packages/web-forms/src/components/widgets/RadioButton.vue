<script lang="ts" setup>
import TextMedia from '@/components/widgets/TextMedia.vue';
import { selectOptionId } from '@/lib/format/selectOptionId.ts';
import type { SelectNode } from '@getodk/xforms-engine';
import RadioButton from 'primevue/radiobutton';

interface RadioButtonProps {
	readonly question: SelectNode;
}

defineEmits(['update:modelValue', 'change']);
const props = defineProps<RadioButtonProps>();

const selectValue = (value: string) => {
	props.question.selectValue(value);
};
</script>

<template>
	<label
		v-for="option in question.currentState.valueOptions"
		:key="option.value"
		:for="selectOptionId(question, option)"
		:class="{
			'value-option': true,
			active: question.currentState.value[0] === option.value,
			disabled: question.currentState.readonly,
			'no-buttons': question.appearances['no-buttons']
		}"
	>
		<RadioButton
			:input-id="selectOptionId(question, option)"
			:value="option.value"
			:name="question.nodeId"
			:disabled="question.currentState.readonly"
			:model-value="question.currentState.value[0]"
			@update:model-value="selectValue"
			@change="$emit('change')"
		/>
		<TextMedia :label="option.label" />
	</label>
</template>

<style lang="scss" scoped>
@use '../../assets/css/select-options';
</style>
