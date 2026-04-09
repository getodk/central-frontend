<script setup lang="ts">
import MarkdownBlock from '@/components/common/MarkdownBlock.vue';
import { QUESTION_HAS_ERROR, TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import type { AnyViolation } from '@getodk/xforms-engine';
import { computed, type ComputedRef, inject } from 'vue';

const props = withDefaults(
	defineProps<{
		violation?: AnyViolation | null;
		addPlaceholder?: boolean;
	}>(),
	{
		violation: undefined,
		addPlaceholder: true,
	}
);

const t: Translate = inject(TRANSLATE)!;
const showMessage = inject<ComputedRef<boolean>>(
	QUESTION_HAS_ERROR,
	computed(() => false)
);

const defaultMessage = computed(() => {
	if (!props.violation || props.violation.message) {
		return null;
	}

	if (props.violation.condition === 'required') {
		return t('validation_message.required.error')
	}

	return t('validation_message.constraint.error');
});
</script>

<template>
	<div :class="{ 'validation-placeholder': addPlaceholder }">
		<span v-show="showMessage" class="validation-message">
			<template v-if="violation?.message">
				<MarkdownBlock v-for="elem in violation.message.formatted" :key="elem.id" :elem="elem" />
			</template>
			<template v-else-if="defaultMessage">{{ defaultMessage }}</template>
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
