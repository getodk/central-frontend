<script lang="ts" setup>
import TextMedia from '@getodk/web-forms/components/common/TextMedia.vue';
import { selectOptionId } from '@getodk/web-forms/lib/format/ids.ts';
import type { SelectNode } from '@getodk/xforms-engine';
import RadioButton from 'primevue/radiobutton';

interface RadioButtonProps {
	readonly question: SelectNode;
}

defineEmits(['change']);
defineProps<RadioButtonProps>();
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
			@change="$emit('change', option.value)"
		/>
		<TextMedia :label="option.label" :audio-icons-only="question.currentState.isSelectWithImages" />
	</label>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/select-options';
</style>
