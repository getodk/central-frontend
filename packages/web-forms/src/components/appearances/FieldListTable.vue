<script lang="ts" setup>
import type { SelectNodeAppearances } from '@getodk/xforms-engine';

defineProps<{ appearances: SelectNodeAppearances }>();
</script>

<template>
	<div class="table-row" :class="[...appearances]">
		<div class="first-col">
			<slot name="firstColumn" />
		</div>
		<slot />
	</div>
</template>

<style lang="scss" scoped>
.table-row {
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: flex-start;
	border-radius: var(--odk-radius);
	margin-bottom: 6px;
	padding-left: 10px;

	:deep(.control-text) {
		margin-bottom: 0;
	}

	.first-col {
		flex: 0 0 35%;
		text-align: left;
		vertical-align: middle;
	}

	:deep(.value-option) {
		display: flex;
		flex-direction: column-reverse;
		flex: 1;
		min-width: 50px;
		text-align: center;
		vertical-align: middle;
		padding: 15px 0;
		outline: none;
		background-color: unset;

		&.active {
			background-color: unset;
			outline: none;
		}

		&:hover {
			background: unset;
		}

		span.text-content {
			display: table;
			margin: 0;
			color: var(--odk-text-color);
			font-size: var(--odk-base-font-size);
			word-break: normal;
		}
	}
}

.table-row.list-nolabel {
	&:hover {
		background-color: var(--odk-muted-background-color);
	}

	:deep(.value-option) {
		border-radius: var(--odk-radius);
		background-color: transparent;

		.text-content {
			display: none;
		}
	}
}

.table-row.label {
	padding: 0px;

	:deep(.value-option) {
		cursor: default;

		&.active {
			border: 2px solid var(--odk-primary-border-color);
		}

		.p-radiobutton {
			display: none;
		}

		.p-checkbox {
			display: none;
		}

		&:has(.p-checkbox-input:hover),
		&:has(.p-radiobutton-input:hover) {
			background-color: unset;
			outline: none;
		}
	}
}

.table-row.list {
	margin-top: -30px;

	&:hover {
		background-color: var(--odk-muted-background-color);
	}

	:deep(.value-option) {
		position: relative;
		gap: 10px;
		justify-content: center;

		.p-checkbox,
		.p-radiobutton,
		.text-content {
			position: relative;
		}
	}
}
</style>
