<script setup lang="ts">
import { getModeConfig, MODES, VALID_CANVAS_MODES } from '@/components/common/canvas/getModeConfig.ts';
import IconSVG from '@/components/common/IconSVG.vue';
import ControlText from '@/components/form-elements/ControlText.vue';
import { FORM_OPTIONS, TRANSLATE } from '@/lib/constants/injection-keys.ts';
import { resize } from '@/lib/services/resizeImage';
import type { FormOptions } from '@/lib/init/load-form-state';
import type { Translate } from '@/lib/locale/useLocale.ts';
import type { UploadNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { computed, inject, onUnmounted, ref, watchEffect } from 'vue';
import DeleteConfirmDialog from './DeleteConfirmDialog.vue';
import UploadAudioHeader from './UploadAudioHeader.vue';
import UploadAudioPreview from './UploadAudioPreview.vue';
import UploadFileHeader from './UploadFileHeader.vue';
import UploadFilePreview from './UploadFilePreview.vue';
import UploadImageHeader from './UploadImageHeader.vue';
import UploadImagePreview from './UploadImagePreview.vue';
import UploadVideoHeader from './UploadVideoHeader.vue';
import UploadVideoPreview from './UploadVideoPreview.vue';

type ObjectURL = `blob:${string}`;

const MAX_FILE_SIZE = 100_000_000; // 100MB
const SUPPORTED_MEDIA_TYPES = ['audio', 'image', 'video'];

export interface UploadControlProps {
	readonly question: UploadNode;
}

const props = defineProps<UploadControlProps>();
const formOptions = inject<FormOptions>(FORM_OPTIONS);
const t: Translate = inject(TRANSLATE)!;

const isDisabled = computed(() => props.question.currentState.readonly === true);
const fileName = computed(() => props.question.currentState.value?.name ?? '');
const accept = computed(() => props.question.nodeOptions.media.accept);
const mediaType = computed(() => props.question.nodeOptions.media.type);
const maxFileSize = computed(() => formOptions?.attachmentMaxSize ?? MAX_FILE_SIZE);
const loading = computed(() => props.question.currentState.attachmentState.loading);
const loadingError = computed(() => props.question.currentState.attachmentState.loadingError);
const existingFileName = computed(() => props.question.currentState.attachmentState.intrinsicName ?? '');
const confirmDeleteAction = ref(false);
const isCanvasFullScreen = ref(false);
const sourceImageKey = ref(0);
const fileError = ref<string | null>(null);
const canvasMode = computed(() => VALID_CANVAS_MODES.find((mode) => props.question.appearances[mode]));
const fileType = computed(() => getFileType(props.question.currentState.value?.type));
const isBlankCanvas = computed(() => {
	return canvasMode.value != null && !getModeConfig(canvasMode.value).hasBackgroundImage;
});
const showImagePreview = computed(() => fileType.value === 'image' || isBlankCanvas.value);
const canvasEmptyPlaceholder = computed(() => {
	if (canvasMode.value === MODES.SIGNATURE) {
		return t('upload_control.no_signature.placeholder');
	}
	if (canvasMode.value === MODES.DRAW) {
		return t('upload_control.no_drawing.placeholder');
	}
	return '';
});

const objectURL = computed((previous: ObjectURL | null = null) => {
	if (previous != null) {
		URL.revokeObjectURL(previous);
	}

	const file = props.question.currentState.value;
	if (!file) {
		return null;
	}

	const type = getFileType(file.type);
	if (!type || type === '*') {
		return null;
	}

	return URL.createObjectURL(file) satisfies string as ObjectURL;
});

// Original (unresized) image URL so the canvas draws at full resolution, while the
// submission uses the resized version from question.currentState.value.
const canvasBaseImage = ref<ObjectURL | null>(null);

const getFileType = (type: string | undefined) => {
	if (!type) {
		return;
	}
	const primary = type.split('/')[0];
	if (primary && SUPPORTED_MEDIA_TYPES.includes(primary)) {
		return primary;
	}
	return '*';
};

const validateFile = (file: File) => {
	if (file.size > maxFileSize.value) {
		fileError.value = t('upload_control.file_too_large.error');
		return false;
	}

	// accept everything
	if (accept.value === '*') {
		fileError.value = null;
		return true;
	}

	const acceptParts = accept.value.split(',').map((part) => part.trim());
	for (const part of acceptParts) {
		if (part.startsWith('.')) {
			// looks like an extension check
			if (file.name.endsWith(part)) {
				fileError.value = null;
				return true;
			}
		} else {
			// looks like a mimetype
			const type = file.type.split('/')[0];
			if (part === `${type}/*` || part === file.type) {
				fileError.value = null;
				return true;
			}
		}
	}

	if (mediaType.value === 'image') {
		fileError.value = t('upload_control.must_be_image.error');
	} else if (mediaType.value === 'video') {
		fileError.value = t('upload_control.must_be_video.error');
	} else if (mediaType.value === 'audio') {
		fileError.value = t('upload_control.must_be_audio.error');
	} else {
		fileError.value = t('upload_control.invalid_file_type.error');
	}

	return false;
};

const setCanvasBaseImage = (file: File) => {
	if (canvasBaseImage.value) {
		URL.revokeObjectURL(canvasBaseImage.value);
	}

	canvasBaseImage.value = URL.createObjectURL(file) as ObjectURL;
};

watchEffect(() => {
	// Initialize for edit submissions, default images cases.
	const file = props.question.currentState.value;
	if (file && canvasMode.value && !canvasBaseImage.value) {
		setCanvasBaseImage(file);
	}
});

const resizeImage = async (file: File): Promise<File> => {
	const max = props.question.maxPixels;
	return mediaType.value === 'image' && max ? resize(file, max) : file;
};

const updateValue = async (file: File | null) => {
	if (isDisabled.value) {
		return;
	}

	// Null comes from the canvas when the user has explicitly cleared the strokes.
	if (file === null) {
		props.question.setValue(null);
		return;
	}

	if (!validateFile(file)) {
		return;
	}

	if (canvasMode.value) {
		setCanvasBaseImage(file);
	}

	try {
		const processed = await resizeImage(file);
		props.question.setValue(processed);
	} catch {
		// Resize failed — save the original file.
		props.question.setValue(file);
	}
};

const revokeOriginalImage = () => {
	if (canvasBaseImage.value) {
		URL.revokeObjectURL(canvasBaseImage.value);
		canvasBaseImage.value = null;
	}
};

const clearValueConfirmed = () => {
	confirmDeleteAction.value = false;
	revokeOriginalImage();
	props.question.setValue(null);
};

const clearValue = () => {
	fileError.value = null;
	if (isDisabled.value || props.question.currentState.value == null) {
		return;
	}
	confirmDeleteAction.value = true;
};

const retryFetch = () => {
	props.question.retryFetch();
};

const onChange = (file: File | null) => {
	if (!file) {
		clearValue();
		return;
	}

	sourceImageKey.value++;
	if (canvasMode.value) {
		isCanvasFullScreen.value = true;
	}
	void updateValue(file);
};

const onDrop = (event: DragEvent) => {
	if (isBlankCanvas.value) {
		return;
	}
	const file = event.dataTransfer?.files?.[0];
	if (file) {
		onChange(file);
	}
};

onUnmounted(() => {
	if (objectURL.value) {
		URL.revokeObjectURL(objectURL.value);
	}
	revokeOriginalImage();
});
</script>

<template>
	<ControlText :question="question" />

	<div class="upload-control" :class="{ 'mobile-only-header': isBlankCanvas }">
		<div class="upload-control-header">
			<template v-if="mediaType === 'image'">
				<UploadImageHeader
					:question="question"
					:accept="accept"
					:canvas-mode="canvasMode"
					:is-disabled="isDisabled"
					@change="onChange"
					@mark-up-image="isCanvasFullScreen = true"
				/>
			</template>
			<template v-else-if="mediaType === 'video'">
				<UploadVideoHeader :question="question" :accept="accept" :is-disabled="isDisabled" @change="onChange" />
			</template>
			<template v-else-if="mediaType === 'audio'">
				<UploadAudioHeader :question="question" :accept="accept" :is-disabled="isDisabled" @change="onChange" />
			</template>
			<template v-else>
				<UploadFileHeader :question="question" :accept="accept" :is-disabled="isDisabled" @change="onChange" />
			</template>
		</div>
		<div class="upload-control-content">
			<div class="drag-and-drop" :class="{ 'disabled': isDisabled, 'canvas-mode': !!canvasMode && showImagePreview }" @drop.prevent.stop="onDrop" @dragover.prevent>
				<div v-if="canvasEmptyPlaceholder.length && !question.currentState.value" class="canvas-empty-placeholder">
					{{ canvasEmptyPlaceholder }}
				</div>
				<div v-if="loading" class="skeleton-loading" :class="{ 'loading-image': mediaType === 'image', 'loading-video': mediaType === 'video', 'loading-audio': mediaType === 'audio' }">
					{{ existingFileName }}
				</div>
				<div v-else-if="question.currentState.value || showImagePreview" class="upload-content" :class="{ 'canvas-no-value': canvasEmptyPlaceholder.length && !question.currentState.value }">
					<template v-if="showImagePreview">
						<UploadImagePreview
							:key="sourceImageKey"
							v-model:is-canvas-full-screen="isCanvasFullScreen"
							:image-preview-url="objectURL"
							:canvas-base-image="canvasBaseImage"
							:canvas-mode="canvasMode"
							:is-disabled="isDisabled"
							@save-image="(file) => void updateValue(file)"
						/>
					</template>
					<template v-else-if="fileType === 'video'">
						<UploadVideoPreview :video="objectURL" />
					</template>
					<template v-else-if="fileType === 'audio'">
						<UploadAudioPreview :audio="objectURL" />
					</template>
					<template v-else>
						<UploadFilePreview :file-name="fileName" />
					</template>
					<Button
						v-if="!isDisabled && !canvasMode"
						:class="{ 'over-preview': fileType === 'image' || fileType === 'video' }"
						severity="secondary"
						outlined
						class="clear-button"
						@click="clearValue"
					>
						<IconSVG name="mdiClose" size="sm" />
					</Button>
				</div>
				<Message v-else-if="fileError" severity="error" :closable="true" @close="fileError = null">
					{{ fileError }}
				</Message>
				<Message v-else-if="loadingError" severity="error" :closable="true" @close="retryFetch()">
					<template #closeicon>
						<IconSVG name="mdiRefresh" variant="muted" size="sm" />
					</template>
					{{ t('upload_control.downloading.error') }}
				</Message>
				<div v-else class="placeholder">
					{{ t('upload_control.drag_and_drop.placeholder') }}
				</div>
			</div>
		</div>
	</div>
	<DeleteConfirmDialog
		v-model:visible="confirmDeleteAction"
		@delete-file="clearValueConfirmed"
	/>
</template>

<style scoped lang="scss">
@use '../../../assets/styles/breakpoints' as odk;

.upload-control {
	background: var(--odk-base-background-color);
	border: 1px solid var(--odk-border-color);
	overflow: hidden;
	border-radius: var(--odk-radius);

	.upload-control-header {
		background: var(--odk-light-background-color);
		gap: var(--odk-spacing-xl);
		border-bottom: 1px solid var(--odk-border-color);
		padding: 12px var(--odk-spacing-xl);
		display: flex;
		align-items: center;
		width: 100%;
	}

	&.mobile-only-header .upload-control-header {
		display: none;
	}
}

.upload-content {
	width: fit-content;
	min-width: min(100%, var(--odk-media-container-size));
	display: flex;
	align-items: center;
	gap: var(--odk-spacing-l);
	position: relative;

	button.clear-button:not(.over-preview) {
		align-self: flex-start;
	}

	button.clear-button.over-preview {
		// Align position with canvas mode buttons
		--odk-upload-clear-spacing: calc(var(--odk-spacing-m) + 1px);
		position: absolute;
		top: var(--odk-upload-clear-spacing);
		right: var(--odk-upload-clear-spacing);
		background: var(--odk-base-background-color);
	}
}

.drag-and-drop.canvas-mode {
	padding: 0;

	.upload-content {
		width: 100%;
	}
}

.drag-and-drop {
	padding: var(--odk-spacing-xxl);

	.skeleton-loading {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 300px;
		min-height: 40px;

		&.loading-image,
		&.loading-video {
			height: var(--odk-max-image-height);
		}

		&.loading-audio {
			height: var(--odk-audio-height);
		}
	}

	&.disabled {
		color: var(--odk-muted-text-color);
	}
	.placeholder {
		text-align: center;
	}
}

.canvas-empty-placeholder {
	display: none;
}

@include odk.sm-constrained {
	.upload-control .upload-control-header {
		flex-direction: column;
		justify-content: center;
	}

	.upload-control.mobile-only-header .upload-control-header {
		display: flex;
	}

	.canvas-empty-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--odk-spacing-xxl);
		color: var(--odk-muted-text-color);
	}

	.upload-content.canvas-no-value {
		height: 0;
		overflow: hidden;
	}
}
</style>
