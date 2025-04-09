<script setup lang="ts">
import ControlText from '@/components/ControlText.vue';
import ValidationMessage from '@/components/ValidationMessage.vue';
import type { UploadNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import { computed, inject, ref } from 'vue';

interface UploadImageControlProps {
	readonly question: UploadNode;
}

const props = defineProps<UploadImageControlProps>();
const touched = ref(false);
const submitPressed = inject<boolean>('submitPressed');
const isDisabled = computed(() => props.question.currentState.readonly === true);
const value = ref<string | null>(null);
const selectImageInput = ref<HTMLInputElement | null>(null);
const takePictureInput = ref<HTMLInputElement | null>(null);
const previewImage = ref<HTMLImageElement | null>(null);
const isSmallImage = ref(false);

const checkCaptureSupport = () => {
	const input = document.createElement('input');
	input.setAttribute('type', 'file');
	input.setAttribute('accept', 'image/*');
	return 'capture' in input;
};

const isCaptureSupported = ref(checkCaptureSupport());

const triggerInputField = (inputField: HTMLInputElement | null) => {
	if (inputField == null) {
		return;
	}

	inputField.click();
};

const processImage = (event: Event) => {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];
	if (file == null) {
		return;
	}

	const reader = new FileReader();

	reader.onload = (loadEvent) => {
		const result = loadEvent.target?.result;
		if (result == null || typeof result !== 'string') {
			setValue(null);
			return;
		}

		setValue(result);
	};

	reader.readAsDataURL(file);
};

const setValue = (file: string | null) => {
	touched.value = true;
	// ToDo: When integrated with xforms-engine, call the node's setValues function here.
	value.value = file;
};

const clear = () => {
	setValue(null);

	if (selectImageInput.value != null) {
		selectImageInput.value.value = '';
	}

	if (takePictureInput.value != null) {
		takePictureInput.value.value = '';
	}
};

const checkImageSize = () => {
	if (previewImage?.value == null) {
		return;
	}

	const SMALL_IMAGE_SIZE = 300;
	isSmallImage.value =
		previewImage.value.naturalWidth < SMALL_IMAGE_SIZE &&
		previewImage.value.naturalHeight < SMALL_IMAGE_SIZE;
};
</script>

<template>
	<ControlText :question="question" />

	<div class="capture-buttons">
		<template v-if="isCaptureSupported">
			<Button
				rounded
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
				accept="image/*"
				capture="environment"
				style="display: none"
				@change="processImage"
			>
		</template>

		<Button
			rounded
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
			<!-- TODO: translations -->
			<span>Choose image</span>
		</Button>
		<input
			ref="selectImageInput"
			type="file"
			accept="image/*"
			style="display: none"
			@change="processImage"
		>
	</div>

	<div v-if="value" class="preview-captured-image" :class="{ 'small-image': isSmallImage }">
		<Button v-if="!isDisabled" severity="secondary" class="clear-button" @click="clear">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="12"
				height="12"
				viewBox="0 0 12 12"
				fill="none"
			>
				<path
					d="M7.01186 6.00931L11.27 1.75114C11.341 1.68499 11.398 1.60522 11.4375 1.51659C11.4769 1.42796 11.4982 1.33228 11.4999 1.23527C11.5016 1.13825 11.4838 1.04188 11.4474 0.951916C11.4111 0.861947 11.357 0.780219 11.2884 0.711608C11.2198 0.642997 11.138 0.588908 11.0481 0.552568C10.9581 0.516228 10.8617 0.498381 10.7647 0.500093C10.6677 0.501805 10.572 0.52304 10.4834 0.562531C10.3948 0.602022 10.315 0.65896 10.2488 0.729949L5.99067 4.98812L1.7325 0.729949C1.59553 0.602319 1.41437 0.532837 1.22718 0.536139C1.03999 0.539442 0.861396 0.615272 0.729015 0.747654C0.596633 0.880036 0.520802 1.05863 0.5175 1.24582C0.514197 1.43301 0.58368 1.61417 0.711309 1.75114L4.96948 6.00931L0.711309 10.2675C0.576001 10.403 0.5 10.5866 0.5 10.7781C0.5 10.9696 0.576001 11.1532 0.711309 11.2887C0.846786 11.424 1.03043 11.5 1.2219 11.5C1.41338 11.5 1.59702 11.424 1.7325 11.2887L5.99067 7.0305L10.2488 11.2887C10.3843 11.424 10.568 11.5 10.7594 11.5C10.9509 11.5 11.1346 11.424 11.27 11.2887C11.4053 11.1532 11.4813 10.9696 11.4813 10.7781C11.4813 10.5866 11.4053 10.403 11.27 10.2675L7.01186 6.00931Z"
					fill="#6B7280"
				/>
			</svg>
		</Button>
		<img ref="previewImage" :src="value" alt="Captured image preview" @load="checkImageSize">
	</div>

	<ValidationMessage
		:message="question.validationState.violation?.message.asString"
		:show-message="touched || submitPressed"
	/>
</template>

<style scoped lang="scss">
@import 'primeflex/core/_variables.scss';

// Variable definition to root element
.capture-buttons,
.preview-captured-image {
	--uploadPreviewSize: 300px;
	--uploadBorderRadius: 10px;
}

.preview-captured-image {
	display: flex;
	justify-content: center;
	align-items: center;
	position: relative;
	width: fit-content;
	height: var(--uploadPreviewSize);
	margin-top: 30px;
	background: var(--gray-200);
	border-radius: var(--uploadBorderRadius);
	overflow: hidden;

	img {
		max-height: var(--uploadPreviewSize);
		max-width: 100%;
		width: auto;
		height: auto;
		display: block;
		object-fit: contain;
	}

	.clear-button {
		position: absolute;
		top: 10px;
		right: 10px;
		border: 1px solid var(--surface-300);
		width: 38px;
		height: 38px;
	}
}

.preview-captured-image.small-image {
	width: var(--uploadPreviewSize);
}

.capture-buttons button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 145px;
	gap: 9px;

	&:not(:last-child) {
		margin-right: 20px;
		margin-bottom: 10px;
	}

	svg {
		margin-right: var(--geo-spacing-s);
	}

	&:disabled svg path {
		fill: var(--surface-500);
	}
}

/**
 * Below overrides PrimeVue style
 */

.p-button.clear-button {
	min-width: 0;
	padding: 12px;
	border-radius: var(--uploadBorderRadius);

	&:not(:disabled):active,
	&:not(:disabled):hover {
		border-color: var(--surface-300);
	}
}
</style>
