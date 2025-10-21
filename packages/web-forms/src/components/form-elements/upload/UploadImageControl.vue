<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import ValidationMessage from '@/components/common/ValidationMessage.vue';
import ControlText from '@/components/form-elements/ControlText.vue';
import type { UploadNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import type { HTMLInputElementEvent, Ref } from 'vue';
import { computed, ref, watchEffect } from 'vue';
import UploadImagePreview from './UploadImagePreview.vue';

const IS_CAPTURE_SUPPORTED = (() => {
	const input = document.createElement('input');

	input.setAttribute('type', 'file');
	input.setAttribute('accept', 'image/*');

	return 'capture' in input;
})();

interface UploadImageControlProps {
	readonly question: UploadNode;
}

const props = defineProps<UploadImageControlProps>();
const isDisabled = computed(() => props.question.currentState.readonly === true);
const selectImageInput = ref<HTMLInputElement | null>(null);
const takePictureInput = ref<HTMLInputElement | null>(null);

/**
 * @todo <button> to trigger sibling <input type="file" style="display: none">
 * is probably a common enough pattern we'll want to make it a component.
 */
const triggerInputField = (inputField: HTMLInputElement | null) => {
	if (inputField == null) {
		return;
	}

	inputField.click();
};

const updateValue = (file: File | null) => {
	props.question.setValue(file);
};

const onChange = (event: HTMLInputElementEvent) => {
	updateValue(event.target.files?.[0] ?? null);
};

const clearInputRefValue = (inputRef: Ref<HTMLInputElement | null>) => {
	if (inputRef.value != null) {
		inputRef.value.value = '';
	}
};

watchEffect(() => {
	if (props.question.currentState.value == null) {
		clearInputRefValue(selectImageInput);
		clearInputRefValue(takePictureInput);
	}
});
</script>

<template>
	<ControlText :question="question" />

	<div class="capture-buttons">
		<!-- TODO: Good candidate for <slot> in a general component -->
		<template v-if="IS_CAPTURE_SUPPORTED">
			<Button
				class="take-picture-button"
				:disabled="isDisabled"
				@click="triggerInputField(takePictureInput)"
			>
				<IconSVG name="mdiCamera" variant="inverted" />
				<!-- TODO: translations -->
				<span>Take picture</span>
			</Button>

			<input
				ref="takePictureInput"
				type="file"
				:accept="question.nodeOptions.media.accept"
				capture="environment"
				style="display: none"
				@change="onChange"
			>
		</template>

		<Button
			class="choose-image-button"
			:disabled="isDisabled"
			@click="triggerInputField(selectImageInput)"
		>
			<IconSVG name="mdiImage" variant="inverted" />
			<!-- TODO: Good candidate for <slot> in a general component -->
			<!-- TODO: translations -->
			<span>Choose image</span>
		</Button>
		<input
			ref="selectImageInput"
			type="file"
			:accept="question.nodeOptions.media.accept"
			style="display: none"
			@change="onChange"
		>
	</div>

	<!-- TODO: good candidate for <slot> in a general component -->
	<UploadImagePreview
		:question="question"
		:is-disabled="isDisabled"
		@clear="updateValue(null)"
	/>

	<ValidationMessage
		:message="question.validationState.violation?.message.formatted"
	/>
</template>

<style scoped lang="scss">
.capture-buttons button:not(:last-child) {
	margin-right: 20px;
	margin-bottom: 10px;
}
</style>
