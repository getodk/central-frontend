<script lang="ts" setup>
import type { SelectNode } from '@getodk/xforms-engine';
import ControlLabel from '../ControlLabel.vue';
import ColumnarAppearance from '../appearances/ColumnarAppearance.vue';
import FieldListTable from '../appearances/FieldListTable.vue';
import CheckboxWidget from '../widgets/CheckboxWidget.vue';
import MultiselectDropdown from '../widgets/MultiselectDropdown.vue';
import UnsupportedAppearance from './UnsupportedAppearance.vue';

const props = defineProps<{question: SelectNode}>();

const hasColumnsAppearance = [...props.question.appearances].filter(a => a.startsWith('columns')).length > 0;

const fieldListRelatedAppearances = new Set(['label', 'list-nolabel', 'list']);
const hasFieldListRelatedAppearance = !![...props.question.appearances].find(a => fieldListRelatedAppearances.has(a));

</script>

<template>
	<ControlLabel v-if="!hasFieldListRelatedAppearance" :question="question" />
  
	<MultiselectDropdown v-if="question.appearances.autocomplete || question.appearances.minimal" :question="question" />

	<FieldListTable v-else-if="hasFieldListRelatedAppearance" :appearances="question.appearances">
		<template #firstColumn>
			<ControlLabel :question="question" />
		</template>
		<template #default>
			<CheckboxWidget :question="question" />
		</template>
	</FieldListTable>		

	<ColumnarAppearance v-else-if="hasColumnsAppearance" :appearances="question.appearances">
		<CheckboxWidget :question="question" />
	</ColumnarAppearance>		

	<template v-else>
		<template v-if="question.appearances.map || question.appearances['image-map']">
			<UnsupportedAppearance :appearance="[...question.appearances].toString()" node-type="Select" />
		</template>
		<div class="default-appearance">
			<CheckboxWidget :question="question" />
		</div>
	</template>
</template>

<style lang="scss" scoped>
@import 'primeflex/core/_variables.scss';

.default-appearance {
	width: 100%;

	@media screen and (min-width: #{$md}) {
		min-width: 50%;
		width: max-content;
		max-width: 100%;
	}
}
</style>