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
const submitPressed = inject<boolean>('submitPressed', false);
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

		return getRankItems();
	},
	set: (orderedValues) => {
		touched.value = true;
		props.question.setValues(orderedValues);
	},
});

const getRankItems = () => props.question.currentState.valueOptions.map((option) => option.value);

const selectDefaultOrder = () => {
	values.value = getRankItems();
};

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

	<div class="rank-control-container">
		<div v-if="!touched" class="rank-overlay">
			<button :disabled="disabled" @click="selectDefaultOrder">
				<svg xmlns="http://www.w3.org/2000/svg" width="8" height="15" viewBox="0 0 8 15" fill="none">
					<path d="M3.91263 2.57495L5.96263 4.52245C6.28763 4.8312 6.81263 4.8312 7.13763 4.52245C7.46263 4.2137 7.46263 3.71495 7.13763 3.4062L4.49596 0.888697C4.17096 0.579948 3.64596 0.579948 3.32096 0.888697L0.679297 3.4062C0.354297 3.71495 0.354297 4.2137 0.679297 4.52245C1.0043 4.8312 1.5293 4.8312 1.8543 4.52245L3.91263 2.57495ZM3.91263 12.3441L1.86263 10.3966C1.53763 10.0879 1.01263 10.0879 0.68763 10.3966C0.36263 10.7054 0.36263 11.2041 0.68763 11.5129L3.3293 14.0304C3.6543 14.3391 4.1793 14.3391 4.5043 14.0304L7.14596 11.5208C7.47096 11.212 7.47096 10.7133 7.14596 10.4045C6.82096 10.0958 6.29596 10.0958 5.97096 10.4045L3.91263 12.3441Z" fill="#323232" />
				</svg>
				<!-- TODO: translations -->
				<span>Rank items</span>
			</button>
		</div>

		<VueDraggable
			:id="question.nodeId"
			v-model="values"
			:delay="HOLD_DELAY"
			:delay-on-touch-only="true"
			:disabled="disabled"
			ghost-class="fade-moving"
			class="rank-control"
			:class="{ disabled: disabled }"
		>
			<div
				v-for="(value, index) in values"
				:id="value"
				:key="value"
				class="rank-option"
				:class="{ moving: highlight.index.value === index }"
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
						:disabled="disabled || index === 0"
						@click="moveUp(index)"
						@mousedown="setHighlight(index)"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 768 768">
							<path d="M384 256.5l192 192-45 45-147-147-147 147-45-45z" />
						</svg>
					</button>

					<button
						v-if="values.length > 1"
						:disabled="disabled || index === values.length - 1"
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
	</div>

	<ValidationMessage
		:message="question.validationState.violation?.message.asString"
		:show-message="touched || submitPressed"
	/>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

// Variable definition to root element
.rank-control-container {
	--rankSpacing: 7px;
}

// Overriding VueDraggable's sortable-chosen class
.sortable-chosen {
	opacity: 0.9;
	background-color: var(--odk-base-background-color);
}

.rank-control-container {
	position: relative;
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
	padding: 6px;
	background: var(--odk-base-background-color);
	border: 1px solid var(--odk-border-color);
	border-radius: var(--odk-radius);
	font-size: var(--odk-answer-font-size);
	line-height: 17px;
	color: var(--odk-text-color);
	cursor: move;

	.rank-label {
		display: flex;
		align-items: center;
		gap: var(--rankSpacing);
	}

	.rank-label svg {
		flex-shrink: 0;
	}
}

.moving,
.fade-moving {
	background: var(--odk-primary-lighter-background-color);
	border: 2px solid var(--odk-primary-border-color);
}

.fade-moving {
	opacity: 0.5;
}

.rank-overlay button,
.rank-buttons button {
	display: flex;
	align-items: center;
	gap: var(--rankSpacing);
	border: 1px solid var(--odk-border-color);
	border-radius: var(--odk-radius);
	background: var(--odk-base-background-color);
	padding: var(--rankSpacing);
	line-height: 0;

	&:disabled {
		background: var(--odk-inactive-background-color);
		color: var(--odk-muted-text-color);
		border: none;

		svg path {
			fill: var(--odk-muted-text-color);
		}
	}
}

.disabled .rank-option,
.disabled button {
	cursor: not-allowed;
}

.rank-buttons {
	display: flex;
	gap: var(--rankSpacing);

	button:hover:not(:disabled) {
		background: var(--odk-muted-background-color);
		border: 1px solid var(--odk-border-color);
	}
}

.rank-overlay {
	position: absolute;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: rgba(from var(--odk-muted-background-color) r g b / 0.9);
	border-radius: var(--odk-radius);

	button {
		padding: 10px 20px;
		font-size: var(--odk-base-font-size);

		&:hover:not(:disabled) {
			background: var(--odk-inactive-background-color);
			border: 1px solid var(--odk-border-color);
		}
	}
}

.highlight .rank-overlay {
	background-color: rgba(from var(--odk-muted-background-color) r g b / 0.9);
}

@media screen and (max-width: #{pf.$sm}) {
	.rank-buttons {
		display: none;
	}
}
</style>
