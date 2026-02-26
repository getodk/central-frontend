<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import { ISO_TIME_WITH_OPTIONAL_OFFSET_PATTERN } from '@getodk/common/constants/datetime.ts';
import type { TimeInputNode } from '@getodk/xforms-engine';
import DatePicker from 'primevue/datepicker';
import { computed } from 'vue';

const props = defineProps<{ readonly question: TimeInputNode }>();

const isDisabled = computed(() => props.question.currentState.readonly === true);

const value = computed({
	get: () => {
		if (props.question.currentState.value == null) {
			return null;
		}

		const temporalValue = props.question.currentState.value.toString();
		if (!ISO_TIME_WITH_OPTIONAL_OFFSET_PATTERN.test(temporalValue)) {
			return null;
		}

		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, '0');
		const dd = String(today.getDate()).padStart(2, '0');
		return new Date(`${yyyy}-${mm}-${dd}T${temporalValue}`);
	},
	set: (newTime) => {
		// Clear seconds and milliseconds to match Collect and Enketo behavior (a client's responsibility).
		if (newTime) {
			newTime.setMilliseconds(0);
			newTime.setSeconds(0);
		}
		props.question.setValue(newTime);
	},
});
</script>

<template>
	<DatePicker v-model="value" time-only hour-format="12" :disabled="isDisabled" show-icon icon-display="input">
		<template #inputicon="slotProps">
			<IconSVG name="mdiClockTimeThreeOutline" variant="light-muted" @click="slotProps.clickCallback" />
		</template>
	</DatePicker>
</template>
