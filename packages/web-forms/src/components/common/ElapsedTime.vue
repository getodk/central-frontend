<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import type { IntervalID } from '@getodk/common/types/timers.ts';

type TimeMinute = number;
type TimeSecond = number;
type TimeMillisecond = number;

interface ElapsedTimeProps {
	readonly startTime?: TimeMillisecond;
}

const props = defineProps<ElapsedTimeProps>();
const startTime = props.startTime ?? Date.now();
const elapsedSeconds = ref<TimeSecond>(0);

const TICK_SECOND: TimeMillisecond = 1000;

let tickIntervalID: IntervalID | null = setInterval(() => {
	const elapsedMilliseconds: TimeMillisecond = Date.now() - startTime;
	elapsedSeconds.value = Math.floor(elapsedMilliseconds / 1000);
}, TICK_SECOND);

onBeforeUnmount(() => {
	if (tickIntervalID != null) {
		clearInterval(tickIntervalID);
		tickIntervalID = null;
	}
});

const minutes = computed((): TimeMinute => {
	return Math.floor(elapsedSeconds.value / 60);
});

const seconds = computed((): TimeSecond => {
	return elapsedSeconds.value % 60;
});
</script>

<template>
	<span class="elapsed-time">
		{{ minutes }}:{{ seconds.toString().padStart(2, '0') }}
	</span>
</template>
