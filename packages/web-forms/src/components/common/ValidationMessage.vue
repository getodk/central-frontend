<script setup lang="ts">
import { QUESTION_HAS_ERROR } from '@/lib/constants/injection-keys.ts';
import { type ComputedRef, inject, computed } from 'vue';

withDefaults(
	defineProps<{
		message?: string;
		addPlaceholder?: boolean;
	}>(),
	{
		message: undefined,
		addPlaceholder: true,
	}
);

const showMessage = inject<ComputedRef<boolean>>(
	QUESTION_HAS_ERROR,
	computed(() => false)
);
</script>

<template>
	<div :class="{ 'validation-placeholder': addPlaceholder }">
		<span v-show="showMessage" class="validation-message">
			{{ message }}
		</span>
	</div>
</template>

<style scoped lang="scss">
.validation-placeholder {
	min-height: 2rem;
}
.validation-message {
	color: var(--odk-error-text-color);
	margin-top: 0.6rem;
	display: block;
}
</style>
