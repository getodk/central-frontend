<script setup lang="ts">
import { ISO_DATE_LIKE_PATTERN } from '@getodk/common/constants/datetime.ts';
import type { DateInputNode } from '@getodk/xforms-engine';
import DatePicker from 'primevue/datepicker';
import { computed } from 'vue';
import { useDateTimeInput } from './useDateTimeInput.ts';

const props = defineProps<{ readonly question: DateInputNode }>();
const { localeDateFormat, getTemporalString } = useDateTimeInput();

const isMonthYear = computed(() => props.question.appearances['month-year']);
const isYearOnly = computed(() => props.question.appearances.year);

const value = computed({
	get: () => {
		const temporalValue = getTemporalString(props.question.currentState.value, ISO_DATE_LIKE_PATTERN);
		// Convert to ISO string (yyyy-mm-dd) and append time for start of day local
		return temporalValue === null ? null : new Date(temporalValue + 'T00:00:00');
	},
	set: (newDate) => {
		if (newDate != null) {
			if (isMonthYear.value || isYearOnly.value) {
				newDate.setDate(1);
			}

			if (isYearOnly.value) {
				newDate.setMonth(0);
			}
		}
		props.question.setValue(newDate);
	},
});

// PrimeVue has its date format convention, for example, 'yy' = 4-digit year
const pickerConfig = computed(() => {
	const hideTodayClass = 'hide-today-button';
	if (isMonthYear.value) {
		return {
			view: 'month',
			dateFormat: 'MM yy',
			placeholder: 'mmm yyyy',
			panelClass: hideTodayClass
		};
	}

	if (isYearOnly.value) {
		return { view: 'year', dateFormat: 'yy', placeholder: 'yyyy', panelClass: hideTodayClass };
	}

	return {
		view: 'date',
		dateFormat: undefined, // Fallback to PrimeVue locale default
		placeholder: localeDateFormat.value,
	};
});

const isDisabled = computed(() => props.question.currentState.readonly === true);
</script>

<template>
	<DatePicker
		v-model="value"
		:view="pickerConfig.view"
		:date-format="pickerConfig.dateFormat"
		show-icon
		icon-display="input"
		:panel-class="pickerConfig.panelClass"
		:placeholder="pickerConfig.placeholder"
		show-button-bar
		:disabled="isDisabled"
	/>
</template>
