<script setup lang="ts">
import type { SelectNode } from '@getodk/xforms-engine';
import RadioButton from './RadioButton.vue';

interface LikertWidgetProps {
	readonly question: SelectNode;
}

defineProps<LikertWidgetProps>();
defineEmits(['change']);
</script>

<template>
	<div class="likert">
		<RadioButton :question="question" @change="$emit('change', $event)" />
	</div>
</template>

<style scoped lang="scss">
.likert {
	display: flex;
	flex-wrap: nowrap;
	flex-direction: row;
	line-height: 20px;

	:deep(.value-option) {
		display: flex;
		flex-direction: column;
		flex: 1;
		align-items: center;
		flex-wrap: nowrap;
		cursor: pointer;
		outline: none;
		padding: var(--odk-spacing-m) 0;
		margin-left: var(--odk-spacing-m);
		margin-right: var(--odk-spacing-m);
		background: transparent;
		position: relative;

		&::before {
			content: '';
			position: absolute;
			background-color: var(--odk-border-color);
			height: 3px;
			top: calc(var(--odk-spacing-m) + (var(--p-radiobutton-height) / 2));
			transform: translateY(-50%);
			inset-inline-start: calc(-1 * var(--odk-spacing-m));
			inset-inline-end: calc(-1 * var(--odk-spacing-m));
		}

		&:first-of-type::before {
			inset-inline-start: 50%;
		}

		&:last-of-type::before {
			inset-inline-end: 50%;
		}

		&:hover,
		&.active,
		&.active:hover,
		&:has(.p-radiobutton-input:focus-visible) {
			background-color: transparent;
			outline: none;
		}

		.p-radiobutton {
			position: relative;
			z-index: var(--odk-z-index-form-content);
			margin: 0;
			align-self: unset;
		}

		.text-content {
			text-align: center;
			margin: 0 0 var(--odk-spacing-m) 0;
			width: fit-content;
			position: relative;
			padding-top: var(--odk-spacing-m);
			word-break: break-word;
			max-width: unset;
		}

		.image-block {
			height: auto;
		}

		.media-content {
			flex-basis: unset;
		}
	}
}
</style>
