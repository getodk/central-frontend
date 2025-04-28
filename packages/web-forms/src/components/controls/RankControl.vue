<script setup lang="ts">
import ControlText from '@/components/ControlText.vue';
import IconSVG from '@/components/widgets/IconSVG.vue';
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
				<IconSVG name="mdiUnfoldMoreHorizontal" size="sm" :variant="disabled ? 'muted' : 'base'" />
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
					<IconSVG name="mdiDragVertical" />
					<span>{{ props.question.getValueLabel(value)?.asString }}</span>
				</div>

				<div class="rank-buttons">
					<button
						v-if="values.length > 1"
						:disabled="disabled || index === 0"
						@click="moveUp(index)"
						@mousedown="setHighlight(index)"
					>
						<IconSVG name="mdiChevronUp" size="sm" :variant="disabled || index === 0 ? 'muted' : 'base'" />
					</button>

					<button
						v-if="values.length > 1"
						:disabled="disabled || index === values.length - 1"
						@click="moveDown(index)"
						@mousedown="setHighlight(index)"
					>
						<IconSVG name="mdiChevronDown" size="sm" :variant="disabled || index === values.length - 1 ? 'muted' : 'base'" />
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
	min-height: 50px;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: rgba(from var(--odk-muted-background-color) r g b / 0.9);
	border-radius: var(--odk-radius);

	button {
		padding: 12px 20px;
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
