<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import { resize } from '@/lib/services/resizeImage';
import type { UploadNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import type { HTMLInputElementEvent, Ref } from 'vue';
import { inject, ref, watchEffect } from 'vue';

const IS_CAPTURE_SUPPORTED = (() => {
	const input = document.createElement('input');

	input.setAttribute('type', 'file');
	input.setAttribute('accept', 'image/*');

	return 'capture' in input;
})();

const t: Translate = inject(TRANSLATE)!;
const selectImageInput = ref<HTMLInputElement | null>(null);
const takePictureInput = ref<HTMLInputElement | null>(null);

export interface UploadFileHeaderProps {
	readonly question: UploadNode;
	readonly isDisabled: boolean;
	readonly accept: string;
}

const props = defineProps<UploadFileHeaderProps>();

const triggerInputField = (inputField: HTMLInputElement | null) => {
	if (inputField == null) {
		return;
	}

	inputField.click();
};

const resizeImage = async (file: File | null, max: number | null): Promise<File | null> => {
	if (file && max) {
		return await resize(file, max);
	}
	return file;
};

const updateValue = (file: File | null) => {
	resizeImage(file, props.question.maxPixels)
		.then((image) => {
			emit('change', image);
		})
		.catch((_) => {
			// unspecified error - set the original file
			emit('change', file);
		});
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

const emit = defineEmits(['change']);
</script>

<template>
	<template v-if="IS_CAPTURE_SUPPORTED">
		<Button
			class="take-picture-button"
			:disabled="isDisabled"
			@click="triggerInputField(takePictureInput)"
		>
			<IconSVG name="mdiCamera" variant="inverted" />
			<span>{{ t('upload_image_header.take_picture.label') }}</span>
		</Button>

		<input
			ref="takePictureInput"
			type="file"
			:accept="accept"
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
		<span>{{ t('upload_image_header.choose_image.label') }}</span>
	</Button>
	<input
		ref="selectImageInput"
		type="file"
		:accept="accept"
		style="display: none"
		@change="onChange"
	>
</template>
