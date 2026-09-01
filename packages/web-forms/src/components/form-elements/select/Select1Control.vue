<script lang="ts" setup>
import ColumnarAppearance from '@getodk/web-forms/components/appearances/ColumnarAppearance.vue';
import FieldListTable from '@getodk/web-forms/components/appearances/FieldListTable.vue';
import UnsupportedAppearance from '@getodk/web-forms/components/appearances/UnsupportedAppearance.vue';
import LikertWidget from '@getodk/web-forms/components/common/LikertWidget.vue';
import AsyncMap from '@getodk/web-forms/components/common/map/AsyncMap.vue';
import RadioButton from '@getodk/web-forms/components/common/RadioButton.vue';
import SearchableDropdown from '@getodk/web-forms/components/common/SearchableDropdown.vue';
import ValidationMessage from '@getodk/web-forms/components/common/ValidationMessage.vue';
import ControlText from '@getodk/web-forms/components/form-elements/ControlText.vue';
import type { SelectNode } from '@getodk/xforms-engine';
import { MODES } from '@getodk/web-forms/components/common/map/getModeConfig.ts';
import { computed, ref, watchEffect } from 'vue';

interface Select1ControlProps {
	readonly question: SelectNode;
}

const props = defineProps<Select1ControlProps>();
const isSelectWithImages = computed(() => props.question.currentState.isSelectWithImages);
const hasColumnsAppearance = ref(false);
const hasFieldListRelatedAppearance = ref(false);
const savedFeatureValue = computed(() => {
	if (!props.question.appearances.map) {
		return '';
	}

	const value = props.question.currentState.value?.[0];
	return props.question.currentState.valueOptions.find((option) => option.value === value);
});

const advanceIfQuick = (question: SelectNode) => {
	const { appearances } = question;
	const isQuick = appearances.quick || appearances.quickcompact;
	const isValid = question.validationState.violation == null;

	if (isQuick && !appearances.likert && isValid) {
		question.root.nextPage();
	}
};

const saveSelection = (value: string | undefined) => {
	if (props.question.appearances.label) {
		return;
	}
	props.question.selectValue(value ?? '');
	advanceIfQuick(props.question);
};

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
		@change="saveSelection"
	/>

	<LikertWidget
		v-else-if="question.appearances.likert"
		:class="{ 'select-with-images': isSelectWithImages }"
		:question="question"
		@change="saveSelection"
	/>

	<AsyncMap
		v-else-if="question.appearances.map"
		:features="question.currentState.valueOptions"
		:mode="MODES.SELECT"
		:saved-feature-value="savedFeatureValue"
		:disabled="question.currentState.readonly"
		@save="saveSelection"
	/>

	<FieldListTable
		v-else-if="hasFieldListRelatedAppearance"
		:class="{ 'select-with-images': isSelectWithImages }"
		:appearances="question.appearances"
	>
		<template #firstColumn>
			<ControlText :question="question" />
		</template>
		<template #default>
			<RadioButton :question="question" @change="saveSelection" />
		</template>
	</FieldListTable>

	<ColumnarAppearance
		v-else-if="hasColumnsAppearance"
		:class="{ 'select-with-images': isSelectWithImages }"
		:appearances="question.appearances"
	>
		<RadioButton :question="question" @change="saveSelection" />
	</ColumnarAppearance>

	<template v-else>
		<template v-if="question.appearances['image-map']">
			<UnsupportedAppearance
				:appearance="[...question.appearances].toString()"
				node-type="Select1"
			/>
		</template>
		<div class="default-appearance">
			<RadioButton :question="question" @change="saveSelection" />
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
