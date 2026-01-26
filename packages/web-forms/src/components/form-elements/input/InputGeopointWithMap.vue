<script setup lang="ts">
import AsyncMap from '@/components/common/map/AsyncMap.vue';
import { type Mode, MODES, SINGLE_FEATURE_TYPES } from '@/components/common/map/getModeConfig.ts';
import { IS_FORM_EDIT_MODE } from '@/lib/constants/injection-keys.ts';
import type { GeopointInputNode } from '@getodk/xforms-engine';
import { computed, inject, type ShallowRef } from 'vue';

interface InputGeopointProps {
	readonly question: GeopointInputNode;
}

const isFormEditMode = inject<ShallowRef<boolean>>(IS_FORM_EDIT_MODE);

const props = defineProps<InputGeopointProps>();

const mode = computed<Mode | null>(() => {
	if (isFormEditMode?.value || props.question.appearances['placement-map']) {
		return MODES.PLACEMENT;
	}

	if (props.question.appearances.maps) {
		return MODES.LOCATION;
	}

	return null;
});
</script>

<template>
	<AsyncMap
		v-if="mode"
		:disabled="question.currentState.readonly"
		:mode="mode"
		:saved-feature-value="question.currentState.instanceValue"
		:single-feature-type="SINGLE_FEATURE_TYPES.POINT"
		@save="(value) => question.setValue(value ?? '')"
	/>
</template>
