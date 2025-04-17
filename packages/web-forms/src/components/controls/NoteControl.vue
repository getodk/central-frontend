<script setup lang="ts">
import GeopointFormattedValue from '@/components/controls/GeopointFormattedValue.vue';
import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type { AnyNoteNode, GeopointNoteValue } from '@getodk/xforms-engine';
import { computed } from 'vue';
import ControlText from '../ControlText.vue';

const props = defineProps<{ question: AnyNoteNode }>();

// prettier-ignore
type TextRenderableValue =
	| bigint
	| boolean
	| number
	| string
	| null
	| undefined;

type AssertTextRenderableValue = (value: unknown) => asserts value is TextRenderableValue;

const assertTextRenderableValue: AssertTextRenderableValue = (value) => {
	if (value == null) {
		return;
	}

	switch (typeof value) {
		case 'string':
		case 'number':
		case 'bigint':
		case 'boolean':
			return;

		default:
			throw new Error(`Expected text-renderable value type. Got: ${typeof value}`);
	}
};

type NoteRenderableValue = GeopointNoteValue | TextRenderableValue;

const value = computed<NoteRenderableValue>(() => {
	const { question } = props;

	switch (question.valueType) {
		case 'string':
		case 'int':
		case 'decimal':
		case 'geopoint':
			return question.currentState.value;

		case 'boolean':
		case 'date':
		case 'time':
		case 'dateTime':
		case 'geotrace':
		case 'geoshape':
		case 'binary':
		case 'barcode':
		case 'intent':
			assertTextRenderableValue(question.currentState.value);
			return question.currentState.value;

		default:
			throw new UnreachableError(question);
	}
});
</script>

<template>
	<div class="note-control">
		<ControlText :question="question" />

		<div v-if="value != null" class="note-value">
			<template v-if="question.valueType === 'geopoint'">
				<GeopointFormattedValue :question="question" />
			</template>

			<template v-else>
				{{ value }}
			</template>
		</div>
	</div>
</template>

<style scoped lang="scss">
:deep(.control-text) {
	margin-bottom: 0;
}

.note-value {
	font-weight: 300;
	font-size: var(--odk-answer-font-size);
}
</style>
