<script setup lang="ts">
import { computed } from 'vue';
import DatePicker from 'primevue/datepicker';
import type { DateInputNode } from '@getodk/xforms-engine';
import { ISO_DATE_LIKE_PATTERN } from '@getodk/common/constants/datetime.ts';

interface InputDateProps {
	readonly question: DateInputNode;
}

const props = defineProps<InputDateProps>();

const value = computed({
	get: () => {
		if (props.question.currentState.value == null) {
			return null;
		}

		const temporalValue = props.question.currentState.value.toString();
		if (!ISO_DATE_LIKE_PATTERN.test(temporalValue)) {
			return null;
		}

		// Convert to ISO string (yyyy-mm-dd) and append time for start of day local
		return new Date(temporalValue + 'T00:00:00');
	},
	set: (newDate) => {
		props.question.setValue(newDate);
	},
});

const isDisabled = computed(() => props.question.currentState.readonly === true);
</script>

<template>
	<DatePicker v-model="value" show-icon icon-display="input" show-button-bar :disabled="isDisabled" />
</template>

<style lang="scss">
@import 'primeflex/core/_variables.scss';
.p-datepicker-title button {
	font-size: var(--odk-hint-font-size);
}

.p-datepicker-input:disabled,
.p-datepicker-input:disabled + .p-datepicker-input-icon-container {
	cursor: not-allowed;
}
</style>
