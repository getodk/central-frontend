<script lang="ts" setup>
import ColumnarAppearance from '@getodk/web-forms/components/appearances/ColumnarAppearance.vue';
import FieldListTable from '@getodk/web-forms/components/appearances/FieldListTable.vue';
import UnsupportedAppearance from '@getodk/web-forms/components/appearances/UnsupportedAppearance.vue';
import CheckboxWidget from '@getodk/web-forms/components/common/CheckboxWidget.vue';
import MultiselectDropdown from '@getodk/web-forms/components/common/MultiselectDropdown.vue';
import ValidationMessage from '@getodk/web-forms/components/common/ValidationMessage.vue';
import ControlText from '@getodk/web-forms/components/form-elements/ControlText.vue';
import type { SelectNode } from '@getodk/xforms-engine';
import { computed, ref, watchEffect } from 'vue';

interface SelectNControlProps {
	readonly question: SelectNode;
}

const props = defineProps<SelectNControlProps>();
const isSelectWithImages = computed(() => props.question.currentState.isSelectWithImages);
const hasColumnsAppearance = ref(false);
const hasFieldListRelatedAppearance = ref(false);

watchEffect(() => {
	const appearances = [...props.question.appearances];
	hasFieldListRelatedAppearance.value = appearances.some((appearance) => {
		return ['label', 'list-nolabel', 'list'].includes(appearance);
	});

	if (appearances.length === 0 && isSelectWithImages.value) {
		hasColumnsAppearance.value = true;
	} else {
		hasColumnsAppearance.value = appearances.some((appearance) => appearance.startsWith('columns'));
	}
});
</script>

<template>
	<ControlText v-if="!hasFieldListRelatedAppearance" :question="question" />

	<MultiselectDropdown
		v-if="question.appearances.autocomplete || question.appearances.minimal"
		:question="question"
	/>

	<FieldListTable v-else-if="hasFieldListRelatedAppearance" :class="{ 'select-with-images': isSelectWithImages }" :appearances="question.appearances">
		<template #firstColumn>
			<ControlText :question="question" />
		</template>
		<template #default>
			<CheckboxWidget :question="question" />
		</template>
	</FieldListTable>

	<ColumnarAppearance v-else-if="hasColumnsAppearance" :class="{ 'select-with-images': isSelectWithImages }" :appearances="question.appearances">
		<CheckboxWidget :question="question" />
	</ColumnarAppearance>

	<template v-else>
		<template v-if="question.appearances.map || question.appearances['image-map']">
			<UnsupportedAppearance
				:appearance="[...question.appearances].toString()"
				node-type="Select"
			/>
		</template>
		<div class="default-appearance">
			<CheckboxWidget :question="question" />
		</div>
	</template>

	<ValidationMessage
		:violation="question.validationState.violation"
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
