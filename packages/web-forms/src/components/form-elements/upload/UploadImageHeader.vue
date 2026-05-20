<script setup lang="ts">
import { getModeConfig, MODES, type CanvasMode } from '@/components/common/canvas/getModeConfig.ts';
import IconSVG from '@/components/common/IconSVG.vue';
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import type { UploadNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import type { HTMLInputElementEvent, Ref } from 'vue';
import { computed, inject, ref, watchEffect } from 'vue';

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
	readonly canvasMode?: CanvasMode;
}

const props = defineProps<UploadFileHeaderProps>();
const emit = defineEmits(['change', 'markUpImage']);

const triggerInputField = (inputField: HTMLInputElement | null) => {
	if (inputField == null) {
		return;
	}

	inputField.click();
};

const onChange = (event: HTMLInputElementEvent) => {
	emit('change', event.target.files?.[0] ?? null);
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

const isBlankCanvas = computed(() => {
	return props.canvasMode != null && !getModeConfig(props.canvasMode).hasBackgroundImage;
});

const canvasButtonLabel = computed(() => {
	if (props.canvasMode === MODES.ANNOTATE) {
		return t('upload_image_header.annotation.label');
	}

	if (props.canvasMode === MODES.DRAW) {
		return t('upload_image_header.draw.label');
	}

	if (props.canvasMode === MODES.SIGNATURE) {
		return t('upload_image_header.signature.label');
	}

	return '';
});
</script>

<template>
	<template v-if="!isBlankCanvas">
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

	<Button
		v-if="canvasMode && canvasButtonLabel"
		class="canvas-mobile-button"
		:disabled="isDisabled || (!isBlankCanvas && !question.currentState.value)"
		@click="emit('markUpImage')"
	>
		<IconSVG name="mdiPencil" variant="inverted" />
		<span>{{ canvasButtonLabel }}</span>
	</Button>
</template>

<style scoped lang="scss">
@use '../../../assets/styles/style' as odk;

.canvas-mobile-button {
	display: none;
}

@include odk.sm-constrained {
	.canvas-mobile-button {
		display: flex;
	}
}
</style>
