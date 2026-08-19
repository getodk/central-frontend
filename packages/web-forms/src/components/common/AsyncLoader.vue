<script setup lang="ts">
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, shallowRef } from 'vue';

const props = defineProps<{
	load: () => Promise<void>;
	errorMessage: string;
}>();

const STATES = {
	READY: 'ready',
	LOADING: 'loading',
	ERROR: 'error',
} as const;

const currentState = shallowRef<(typeof STATES)[keyof typeof STATES]>(STATES.LOADING);

const doLoad = async () => {
	currentState.value = STATES.LOADING;
	try {
		await props.load();
		currentState.value = STATES.READY;
	} catch {
		currentState.value = STATES.ERROR;
	}
};

onMounted(() => doLoad());
</script>

<template>
	<div class="async-loader-container">
		<div v-if="currentState === STATES.ERROR" class="async-loader-error">
			<p class="async-loader-error-message">
				{{ errorMessage }}
			</p>
		</div>

		<ProgressSpinner v-else-if="currentState === STATES.LOADING" class="async-loader-spinner" />

		<slot v-else />
	</div>
</template>

<style scoped lang="scss">
.async-loader-container {
	display: flex;
	align-items: center;
	justify-content: center;
	height: fit-content;
	width: 100%;
	min-height: 445px;
	background: var(--odk-light-background-color);
	border-radius: var(--odk-radius);
	color: var(--odk-text-color);

	&.canvas-compact {
		min-height: 200px;
	}
}

.async-loader-error {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 40px;
}

.async-loader-error-message {
	font-size: var(--odk-sub-group-font-size);
	font-weight: 600;
	margin: 0;
}

.async-loader-spinner {
	width: 70px;
	height: 70px;
}
</style>
