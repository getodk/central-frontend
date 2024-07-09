<script setup lang="ts">
import type { SelectNode } from '@getodk/xforms-engine';
import RadioButton from '../widgets/RadioButton.vue';

defineProps<{question: SelectNode}>();

</script>

<template>
	<div class="likert">
		<RadioButton :question="question" />
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
		cursor: pointer;
		outline: none;
		padding: 10px 0;
		margin-left: 10px;
		margin-right: 10px;

		&:last-of-type::before {
			width: calc(50% + 20px);
			right: max(20px, calc(50% - 20px));
		}

		&:first-of-type::before {
			width: calc(50% + 20px);
			left: max(20px, calc(50% - 20px));
		}

		&::before{
			content: '';
			display: block;
			position: relative;
			background-color: #ccc;
			height: 3px;
			width: calc(100% + 20px);
			top: 11px;
		}

		&:hover {
			background-color: var(--primary-100);
		}

		&.active {
			background-color: unset;
			outline: none;

			&:hover {
				background-color: var(--primary-100);
			}
		}


		.p-radiobutton {
			position: relative;
			z-index: 10;
		}

		.label-text {
			text-align: center;
			margin-top: -11.5px;
			margin-left: 0;
			width: 100%;
			position: relative;
			padding-top: 20px;
			display: block;
			word-break: break-word;
		}

	}
}
</style>