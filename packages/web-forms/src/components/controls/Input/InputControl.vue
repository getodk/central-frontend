<script setup lang="ts">
import type { AnyInputNode } from '@getodk/xforms-engine';
import { computed, inject, provide, ref } from 'vue';
import ControlText from '../../ControlText.vue';
import ValidationMessage from '../../ValidationMessage.vue';
import InputDecimal from './InputDecimal.vue';
import InputGeopoint from './Geopoint/InputGeopoint.vue';
import InputInt from './InputInt.vue';
import InputNumbersAppearance from './InputNumbersAppearance.vue';
import InputText from './InputText.vue';

interface InputControlProps {
	readonly node: AnyInputNode;
}

const props = defineProps<InputControlProps>();

const doneAnswering = ref(false);
const submitPressed = inject<boolean>('submitPressed');
const isInvalid = computed(() => props.node.validationState.violation?.valid === false);

provide('doneAnswering', doneAnswering);
provide('isInvalid', isInvalid);
</script>

<template>
	<ControlText :question="node" />

	<div class="input-control-container">
		<template v-if="node.valueType === 'decimal'">
			<InputDecimal :node="node" />
		</template>
		<template v-else-if="node.valueType === 'int'">
			<InputInt :node="node" />
		</template>
		<template v-else-if="node.valueType === 'string' && node.appearances.numbers">
			<InputNumbersAppearance :node="node" />
		</template>
		<template v-else-if="node.valueType === 'geopoint'">
			<InputGeopoint :question="node" />
		</template>
		<template v-else>
			<InputText :node="node" />
		</template>

		<!-- Excluding Geopoint since it doesn't display an error icon in the input box like other input types. TODO: Refactor to allow each input type to determine how errors are displayed. -->
		<i v-show="isInvalid && (doneAnswering || submitPressed) && node.valueType !== 'geopoint'" class="icon-error" />
	</div>
	<ValidationMessage
		:message="node.validationState.violation?.message.asString"
		:show-message="doneAnswering || submitPressed"
	/>
</template>

<style scoped lang="scss">
.input-control-container {
	--input-bgcolor-default: var(--surface-100);
	--input-bgcolor: var(--input-bgcolor-default);
	--input-bgcolor-emphasized: var(--surface-50);
	--input-bgcolor-inside-highlighted: var(--surface-0);
	--input-color: var(--text-color);

	// Using `:has` allows sharing the same state of these custom properties for the
	// state of the `input` itself and associated elements (e.g. number
	// increment/decrement buttons)
	&:has(input.inside-highlighted) {
		--input-bgcolor: var(--input-bgcolor-inside-highlighted);
	}

	// TODO: these styles are probably not long for this world, but it is
	// surprising to me that hover/focus/readonly were treated the same!
	&:has(input.p-variant-filled:enabled:hover),
	&:has(input.p-variant-filled:enabled:focus),
	&:has(input:read-only) {
		--input-bgcolor: var(--input-bgcolor-emphasized);
	}
}

.input-control-container {
	position: relative;

	input.p-inputtext {
		&.p-variant-filled:enabled:hover,
		&.p-variant-filled:enabled:focus,
		&:read-only {
			background-color: var(--input-bgcolor);
		}

		&:read-only {
			cursor: not-allowed;
			opacity: 1;
			background-image: none;
		}
	}

	.icon-error {
		position: absolute;
		inset-inline-end: 10px;
		top: 15px;
		color: var(--error-text-color);
		font-size: 1.2rem;
	}
}
</style>
