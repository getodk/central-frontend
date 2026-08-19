<script setup lang="ts">
import { SINGLE_FEATURE_TYPES } from '@getodk/web-forms/components/common/map/getModeConfig.ts';
import ValidationMessage from '@getodk/web-forms/components/common/ValidationMessage.vue';
import ControlText from '@getodk/web-forms/components/form-elements/ControlText.vue';
import InputGeopoint from '@getodk/web-forms/components/form-elements/input/geopoint/InputGeopoint.vue';
import InputGeopointWithMap from '@getodk/web-forms/components/form-elements/input/InputGeopointWithMap.vue';
import InputDate from '@getodk/web-forms/components/form-elements/input/InputDate.vue';
import InputDateTime from '@getodk/web-forms/components/form-elements/input/InputDateTime.vue';
import InputDecimal from '@getodk/web-forms/components/form-elements/input/InputDecimal.vue';
import InputGeoMultiPoint from '@getodk/web-forms/components/form-elements/input/InputGeoMultiPoint.vue';
import InputInt from '@getodk/web-forms/components/form-elements/input/InputInt.vue';
import InputNumbersAppearance from '@getodk/web-forms/components/form-elements/input/InputNumbersAppearance.vue';
import InputText from '@getodk/web-forms/components/form-elements/input/InputText.vue';
import InputTime from '@getodk/web-forms/components/form-elements/input/InputTime.vue';
import { IS_FORM_EDIT_MODE } from '@getodk/web-forms/lib/constants/injection-keys.ts';
import type { AnyInputNode } from '@getodk/xforms-engine';
import { inject } from 'vue';

interface InputControlProps {
	readonly node: AnyInputNode;
}

defineProps<InputControlProps>();

const isFormEditMode = inject(IS_FORM_EDIT_MODE);
</script>

<template>
	<ControlText :question="node" />

	<div class="input-control-container">
		<template v-if="node.valueType === 'decimal'">
			<InputDecimal :node="node" />
		</template>
		<template v-else-if="node.valueType === 'int'">
			<InputInt :node="node" />
		</template>
		<template v-else-if="node.valueType === 'string' && node.appearances.numbers">
			<InputNumbersAppearance :node="node" />
		</template>
		<template v-else-if="node.valueType === 'geopoint'">
			<InputGeopointWithMap v-if="isFormEditMode || (node.appearances['placement-map'] || node.appearances.maps)" :question="node" />
			<InputGeopoint v-else :question="node" />
		</template>
		<template v-else-if="node.valueType === 'geoshape'">
			<InputGeoMultiPoint :question="node" :single-feature-type="SINGLE_FEATURE_TYPES.SHAPE" />
		</template>
		<template v-else-if="node.valueType === 'geotrace'">
			<InputGeoMultiPoint :question="node" :single-feature-type="SINGLE_FEATURE_TYPES.TRACE" />
		</template>
		<template v-else-if="node.valueType === 'date'">
			<InputDate :question="node" />
		</template>
		<template v-else-if="node.valueType === 'time'">
			<InputTime :question="node" />
		</template>
		<template v-else-if="node.valueType === 'dateTime'">
			<InputDateTime :question="node" />
		</template>
		<template v-else>
			<InputText :node="node" />
		</template>
	</div>
	<ValidationMessage :violation="node.validationState.violation" />
</template>

<style scoped lang="scss">
.input-control-container {
	--input-bgcolor: var(--odk-muted-background-color);
	--input-bgcolor-emphasized: var(--odk-light-background-color);

	// TODO: these styles are probably not long for this world, but it is
	// surprising to me that hover/focus/readonly were treated the same!
	&:has(input.p-variant-filled:enabled:hover),
	&:has(input.p-variant-filled:enabled:focus),
	&:has(input:read-only) {
		--input-bgcolor: var(--input-bgcolor-emphasized);
	}
}

.input-control-container {
	position: relative;

	input.p-inputtext {
		&.p-variant-filled:enabled:hover,
		&.p-variant-filled:enabled:focus,
		&:read-only {
			background-color: var(--input-bgcolor);
		}

		&:read-only {
			opacity: 1;
			background-image: none;
		}
	}
}
</style>
