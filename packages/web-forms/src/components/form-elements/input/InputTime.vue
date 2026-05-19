<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import { ISO_TIME_WITH_OPTIONAL_OFFSET_PATTERN } from '@getodk/common/constants/datetime.ts';
import type { TimeInputNode } from '@getodk/xforms-engine';
import DatePicker from 'primevue/datepicker';
import { computed } from 'vue';
import { useDateTimeInput } from './useDateTimeInput.ts';

const props = defineProps<{ readonly question: TimeInputNode }>();
const { hourFormat, clearSubMinute, timeStringToDate, getTemporalString } = useDateTimeInput();

const isDisabled = computed(() => props.question.currentState.readonly === true);

const value = computed({
	get: () => {
		const temporalValue = getTemporalString(props.question.currentState.value, ISO_TIME_WITH_OPTIONAL_OFFSET_PATTERN);
		return temporalValue === null ? null : timeStringToDate(temporalValue);
	},
	set: (newTime) => {
		if (newTime) {
			clearSubMinute(newTime);
		}
		props.question.setValue(newTime);
	},
});
</script>

<template>
	<DatePicker v-model="value" time-only :hour-format="hourFormat" :disabled="isDisabled" show-icon icon-display="input">
		<template #inputicon="slotProps">
			<IconSVG name="mdiClockTimeThreeOutline" variant="light-muted" @click="slotProps.clickCallback" />
		</template>
	</DatePicker>
</template>
