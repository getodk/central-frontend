<script setup lang="ts">
import ControlText from '@/components/ControlText.vue';
import ValidationMessage from '@/components/ValidationMessage.vue';
import type { UploadNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import type { HTMLInputElementEvent, Ref } from 'vue';
import { computed, inject, ref, watchEffect } from 'vue';
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

const touched = ref(props.question.currentState.value != null);
const submitPressed = inject<boolean>('submitPressed', false);
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
	touched.value = true;
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
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="12"
					height="11"
					viewBox="0 0 12 11"
					fill="none"
				>
					<path
						d="M8.94478 1.33333L7.87728 0.166664H4.37728L3.30978 1.33333H0.293945V10.6667H11.9606V1.33333H8.94478ZM6.12728 8.91666C4.51728 8.91666 3.21061 7.61 3.21061 6C3.21061 4.39 4.51728 3.08333 6.12728 3.08333C7.73728 3.08333 9.04395 4.39 9.04395 6C9.04395 7.61 7.73728 8.91666 6.12728 8.91666Z"
						fill="white"
					/>
				</svg>
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
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="11"
				height="12"
				viewBox="0 0 11 12"
				fill="none"
			>
				<path
					d="M10.6355 11.25V0.75H0.135498V11.25H10.6355ZM3.34383 6.875L4.80216 8.63083L6.84383 6L9.46883 9.5H1.30216L3.34383 6.875Z"
					fill="white"
				/>
			</svg>

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
		:message="question.validationState.violation?.message.asString"
		:show-message="touched || submitPressed"
	/>
</template>

<style scoped lang="scss">
.capture-buttons button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 145px;
	gap: 0px;

	&:not(:last-child) {
		margin-right: 20px;
		margin-bottom: 10px;
	}

	svg {
		margin-right: 5px;
		width: 16px;
		height: 24px;
	}
}
</style>
