<script setup lang="ts">
import type { SelectNode } from '@getodk/xforms-engine';
import RadioButton from '../widgets/RadioButton.vue';

interface LikertWidgetProps {
	readonly question: SelectNode;
}

defineProps<LikertWidgetProps>();
defineEmits(['change']);
</script>

<template>
	<div class="likert">
		<RadioButton :question="question" @change="$emit('change')" />
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
		padding: 10px 0;
		margin-left: 10px;
		margin-right: 10px;
		background: transparent;

		&:last-of-type::before {
			width: calc(50% + 20px);
			right: max(20px, calc(50% - 20px));
		}

		&:first-of-type::before {
			width: calc(50% + 20px);
			left: max(20px, calc(50% - 20px));
		}

		&::before {
			content: '';
			display: block;
			position: relative;
			background-color: var(--odk-border-color);
			height: 3px;
			width: calc(100% + 20px);
			top: 11px;
		}

		&:hover,
		&.active,
		&.active:hover {
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
			margin: -11.5px 0 10px 0;
			width: 100%;
			position: relative;
			padding-top: 20px;
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
