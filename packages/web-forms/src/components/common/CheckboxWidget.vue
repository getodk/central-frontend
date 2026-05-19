<script lang="ts" setup>
import TextMedia from '@/components/common/TextMedia.vue';
import { selectOptionId } from '@/lib/format/select-option-id.ts';
import type { SelectNode } from '@getodk/xforms-engine';
import Checkbox from 'primevue/checkbox';

interface CheckboxWidgetProps {
	readonly question: SelectNode;
	readonly style?: string;
}

defineEmits(['update:modelValue', 'change']);
const props = defineProps<CheckboxWidgetProps>();

const selectValues = (values: readonly string[]) => {
	if (props.question.appearances.label) {
		return;
	}
	props.question.selectValues(values);
};
</script>

<template>
	<label
		v-for="option of question.currentState.valueOptions"
		:key="option.value"
		:class="[{
			'value-option': true,
			active: question.isSelected(option.value),
			disabled: question.currentState.readonly,
			'no-buttons': question.appearances['no-buttons'] }]"
		:for="selectOptionId(question, option)"
	>
		<Checkbox
			:input-id="selectOptionId(question, option)"
			:name="question.nodeId"
			:value="option.value"
			:disabled="question.currentState.readonly"
			:model-value="question.currentState.value"
			@update:model-value="selectValues"
			@change="$emit('change')"
		/>
		<TextMedia :label="option.label" :audio-icons-only="question.currentState.isSelectWithImages" />
	</label>
</template>

<style scoped lang="scss">
@use '../../assets/styles/select-options';
</style>
