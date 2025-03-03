<script setup lang="ts">
import ControlText from '@/components/ControlText.vue';
import ValidationMessage from '@/components/ValidationMessage.vue';
import type { TimerID } from '@getodk/common/types/timers.ts';
import type { RankNode } from '@getodk/xforms-engine';
import type { Ref } from 'vue';
import { computed, inject, ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

interface RankControlProps {
	readonly question: RankNode;
}

interface HighlightOption {
	index: Ref<number | null>;
	timeoutID: TimerID | null;
}

const props = defineProps<RankControlProps>();
const touched = ref(false);
const submitPressed = inject<boolean>('submitPressed');
const disabled = computed(() => props.question.currentState.readonly === true);
const highlight: HighlightOption = {
	index: ref(null),
	timeoutID: null,
};

/**
 * Delay in ms to show the highlight styles on rank's UI.
 */
const HIGHLIGHT_DELAY = 500;

/**
 * Delay in ms to hold an item before dragging, avoids accidental reordering on swipe.
 */
const HOLD_DELAY = 200;

const values = computed<string[]>({
	get: () => {
		const currentValues = props.question.currentState.value;

		if (currentValues.length > 0) {
			return currentValues.slice();
		}

		return props.question.currentState.valueOptions.map((option) => option.value);
	},
	set: (orderedValues) => {
		touched.value = true;
		props.question.setValues(orderedValues);
	},
});

const setHighlight = (index: number | null) => {
	highlight.index.value = index;

	if (highlight.timeoutID) {
		clearTimeout(highlight.timeoutID);
		highlight.timeoutID = null;
	}

	if (highlight.index.value !== null) {
		highlight.timeoutID = setTimeout(() => setHighlight(null), HIGHLIGHT_DELAY);
	}
};

const moveUp = (index: number) => {
	const newPosition = index - 1;
	if (newPosition < 0) {
		return;
	}
	swapItems(index, newPosition);
};

const moveDown = (index: number) => {
	const newPosition = index + 1;
	if (newPosition >= values.value.length) {
		return;
	}
	swapItems(index, newPosition);
};

const swapItems = (index: number, newPosition: number) => {
	if (disabled.value) {
		return;
	}

	setHighlight(index);

	const swappedValues = values.value.slice();
	const movedValue = swappedValues[index];

	swappedValues[index] = swappedValues[newPosition];
	swappedValues[newPosition] = movedValue;
	values.value = swappedValues;

	setHighlight(newPosition);
};
</script>

<template>
	<ControlText :question="question" />

	<VueDraggable
		:id="question.nodeId"
		v-model="values"
		:delay="HOLD_DELAY"
		:delay-on-touch-only="true"
		:disabled="disabled"
		ghost-class="fade-moving"
		class="rank-control"
		:class="{ 'disabled': disabled }"
	>
		<div
			v-for="(value, index) in values"
			:id="value"
			:key="value"
			class="rank-option"
			:class="{ 'moving': highlight.index.value === index }"
			tabindex="0"
			@keydown.up.prevent="moveUp(index)"
			@keydown.down.prevent="moveDown(index)"
		>
			<div class="rank-label">
				<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 768 768">
					<path d="M480 511.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM480 319.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM480 256.5q-25.5 0-45-19.5t-19.5-45 19.5-45 45-19.5 45 19.5 19.5 45-19.5 45-45 19.5zM288 127.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM288 319.5q25.5 0 45 19.5t19.5 45-19.5 45-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5zM352.5 576q0 25.5-19.5 45t-45 19.5-45-19.5-19.5-45 19.5-45 45-19.5 45 19.5 19.5 45z" />
				</svg>
				<span>{{ props.question.getValueLabel(value)?.asString }}</span>
			</div>

			<div class="rank-buttons">
				<button
					v-if="values.length > 1"
					:disabled="disabled || (index === 0)"
					@click="moveUp(index)"
					@mousedown="setHighlight(index)"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 768 768">
						<path d="M384 256.5l192 192-45 45-147-147-147 147-45-45z" />
					</svg>
				</button>

				<button
					v-if="values.length > 1"
					:disabled="disabled || (index === values.length - 1)"
					@click="moveDown(index)"
					@mousedown="setHighlight(index)"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 768 768">
						<path d="M531 274.5l45 45-192 192-192-192 45-45 147 147z" />
					</svg>
				</button>
			</div>
		</div>
	</VueDraggable>

	<ValidationMessage
		:message="question.validationState.violation?.message.asString"
		:show-message="touched || submitPressed"
	/>
</template>

<style scoped lang="scss">
@import 'primeflex/core/_variables.scss';

// Variable definition to root element
.rank-control {
	--rankSpacing: 7px;
	--rankBorder: 1px solid var(--surface-300);
	--rankBorderRadius: 10px;
	--rankHighlightBackground: var(--primary-50);
	--rankHighlightBorder: var(--primary-500);
}

// Overriding VueDraggable's sortable-chosen class
.sortable-chosen {
	opacity: 0.9;
	background-color: var(--surface-0);
}

.rank-control {
	display: flex;
	flex-direction: column;
	flex-wrap: nowrap;
	align-items: flex-start;
	gap: var(--rankSpacing);
}

.rank-option {
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 8px;
	border: var(--rankBorder);
	border-radius: var(--rankBorderRadius);
	font-size: 1rem;
	line-height: 17px;
	color: var(--surface-900);
	cursor: move;

	.rank-label {
		display: flex;
		align-items: center;
		gap: var(--rankSpacing);
	}
}

.moving,
.fade-moving {
	background: var(--rankHighlightBackground);
	border: 2px solid var(--rankHighlightBorder);
}

.fade-moving {
	opacity: 0.5;
}

.rank-buttons {
	display: flex;
	gap: var(--rankSpacing);

	button {
		border: var(--rankBorder);
		border-radius: var(--rankBorderRadius);
		background: var(--surface-0);
		padding: var(--rankSpacing);
		line-height: 0;
	}

	button:hover:not(:disabled) {
		background: var(--rankHighlightBackground);
		border: 1px solid var(--rankHighlightBorder);
	}

	button:disabled {
		background: var(--surface-100);
		border: none;
		svg path {
			fill: var(--surface-300);
		}
	}
}

.disabled .rank-option,
.disabled button {
	cursor: not-allowed;
}

@media screen and (max-width: #{$sm}) {
	.rank-buttons {
		display: none;
	}
}
</style>
