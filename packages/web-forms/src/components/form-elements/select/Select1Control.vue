<script lang="ts" setup>
import ColumnarAppearance from '@/components/appearances/ColumnarAppearance.vue';
import FieldListTable from '@/components/appearances/FieldListTable.vue';
import UnsupportedAppearance from '@/components/appearances/UnsupportedAppearance.vue';
import ControlText from '@/components/form-elements/ControlText.vue';
import ValidationMessage from '@/components/common/ValidationMessage.vue';
import LikertWidget from '@/components/common/LikertWidget.vue';
import RadioButton from '@/components/common/RadioButton.vue';
import SearchableDropdown from '@/components/common/SearchableDropdown.vue';
import type { SelectNode } from '@getodk/xforms-engine';
import { computed, ref, watchEffect } from 'vue';

interface Select1ControlProps {
	readonly question: SelectNode;
}

const props = defineProps<Select1ControlProps>();
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

	<SearchableDropdown
		v-if="question.appearances.autocomplete || question.appearances.minimal"
		:question="question"
	/>

	<LikertWidget
		v-else-if="question.appearances.likert"
		:class="{ 'select-with-images': isSelectWithImages }"
		:question="question"
	/>

	<FieldListTable v-else-if="hasFieldListRelatedAppearance" :class="{ 'select-with-images': isSelectWithImages }" :appearances="question.appearances">
		<template #firstColumn>
			<ControlText :question="question" />
		</template>
		<template #default>
			<RadioButton :question="question" />
		</template>
	</FieldListTable>

	<ColumnarAppearance v-else-if="hasColumnsAppearance" :class="{ 'select-with-images': isSelectWithImages }" :appearances="question.appearances">
		<RadioButton :question="question" />
	</ColumnarAppearance>

	<template v-else>
		<template v-if="question.appearances.map || question.appearances['image-map']">
			<UnsupportedAppearance
				:appearance="[...question.appearances].toString()"
				node-type="Select1"
			/>
		</template>
		<div class="default-appearance">
			<RadioButton :question="question" />
		</div>
	</template>

	<ValidationMessage
		:message="question.validationState.violation?.message.asString"
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
