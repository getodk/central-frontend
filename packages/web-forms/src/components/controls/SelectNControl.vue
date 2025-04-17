<script lang="ts" setup>
import type { SelectNode } from '@getodk/xforms-engine';
import { inject, ref } from 'vue';
import ControlText from '../ControlText.vue';
import ValidationMessage from '../ValidationMessage.vue';
import ColumnarAppearance from '../appearances/ColumnarAppearance.vue';
import FieldListTable from '../appearances/FieldListTable.vue';
import CheckboxWidget from '../widgets/CheckboxWidget.vue';
import MultiselectDropdown from '../widgets/MultiselectDropdown.vue';
import UnsupportedAppearance from './UnsupportedAppearance.vue';

interface SelectNControlProps {
	readonly question: SelectNode;
}

const props = defineProps<SelectNControlProps>();

const hasColumnsAppearance =
	[...props.question.appearances].filter((a) => a.startsWith('columns')).length > 0;

const fieldListRelatedAppearances = new Set(['label', 'list-nolabel', 'list']);
const hasFieldListRelatedAppearance = !![...props.question.appearances].find((a) =>
	fieldListRelatedAppearances.has(a)
);

const touched = ref(false);
const submitPressed = inject<boolean>('submitPressed', false);
</script>

<template>
	<ControlText v-if="!hasFieldListRelatedAppearance" :question="question" />

	<MultiselectDropdown v-if="question.appearances.autocomplete || question.appearances.minimal" :question="question" @change="touched = true" />

	<FieldListTable v-else-if="hasFieldListRelatedAppearance" :appearances="question.appearances">
		<template #firstColumn>
			<ControlText :question="question" />
		</template>
		<template #default>
			<CheckboxWidget :question="question" @change="touched = true" />
		</template>
	</FieldListTable>

	<ColumnarAppearance v-else-if="hasColumnsAppearance" :appearances="question.appearances">
		<CheckboxWidget :question="question" @change="touched = true" />
	</ColumnarAppearance>

	<template v-else>
		<template v-if="question.appearances.map || question.appearances['image-map']">
			<UnsupportedAppearance :appearance="[...question.appearances].toString()" node-type="Select" />
		</template>
		<div class="default-appearance">
			<CheckboxWidget :question="question" @change="touched = true" />
		</div>
	</template>

	<ValidationMessage
		:message="question.validationState.violation?.message.asString"
		:show-message="touched || submitPressed"
		:add-placeholder="!hasFieldListRelatedAppearance"
	/>
</template>

<style lang="scss" scoped>
@use 'primeflex/core/_variables.scss' as pf;
.default-appearance {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 0.8rem;

	@media screen and (min-width: #{pf.$md}) {
		min-width: 50%;
		width: max-content;
		max-width: 100%;
	}
}
</style>
