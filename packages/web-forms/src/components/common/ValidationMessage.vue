<script setup lang="ts">
import MarkdownBlock from '@/components/common/MarkdownBlock.vue';
import { QUESTION_HAS_ERROR } from '@/lib/constants/injection-keys.ts';
import type { MarkdownNode } from '@getodk/xforms-engine';
import { computed, type ComputedRef, inject } from 'vue';

withDefaults(
	defineProps<{
		message?: MarkdownNode[];
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
			<MarkdownBlock v-for="(elem, index) in message" :key="index" :elem="elem" />
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
