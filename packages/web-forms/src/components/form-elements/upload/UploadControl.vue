<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import ControlText from '@/components/form-elements/ControlText.vue';
import { FORM_OPTIONS } from '@/lib/constants/injection-keys.ts';
import type { FormOptions } from '@/lib/init/load-form-state';
import type { UploadNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Panel from 'primevue/panel';
import { computed, inject, ref } from 'vue';
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

export interface UploadControlProps {
	readonly question: UploadNode;
}

const props = defineProps<UploadControlProps>();
const formOptions = inject<FormOptions>(FORM_OPTIONS);

const isDisabled = computed(() => props.question.currentState.readonly === true);
const fileName = computed(() => props.question.currentState.value?.name ?? '');
const accept = computed(() => props.question.nodeOptions.media.accept);
const mediaType = computed(() => props.question.nodeOptions.media.type);
const maxFileSize = computed(() => formOptions?.attachmentMaxSize ?? MAX_FILE_SIZE);
const confirmDeleteAction = ref(false);
const fileError = ref<string | null>(null);

const SUPPORTED_MEDIA_TYPES = ['audio', 'image', 'video'];

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

const fileType = computed(() => getFileType(props.question.currentState.value?.type));

const objectURL = computed((previous: ObjectURL | null = null) => {
	if (previous != null) {
		URL.revokeObjectURL(previous);
	}

	const file = props.question.currentState.value;
	if (file) {
		const type = getFileType(file.type);
		if (type && type !== '*') {
			return URL.createObjectURL(file) satisfies string as ObjectURL;
		}
	}
	return null;
});

const validateFile = (file: File) => {
	if (file.size > maxFileSize.value) {
		// TODO translations
		fileError.value = 'Selected file size exceeds the maximum allowed';
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

	// TODO translations
	if (mediaType.value === 'image') {
		fileError.value = 'Selected file must be an image file';
	} else if (mediaType.value === 'video') {
		fileError.value = 'Selected file must be a video file';
	} else if (mediaType.value === 'audio') {
		fileError.value = 'Selected file must be an audio file';
	} else {
		fileError.value = 'Selected file does not match expected type';
	}

	return false;
};

const updateValue = (file: File) => {
	if (isDisabled.value) {
		return;
	}
	props.question.setValue(validateFile(file) ? file : null);
};

const clearValueConfirmed = () => {
	confirmDeleteAction.value = false;
	props.question.setValue(null);
};

const clearValue = () => {
	fileError.value = null;
	if (isDisabled.value || props.question.currentState.value == null) {
		return;
	}
	confirmDeleteAction.value = true;
};

const onChange = (file: File | null) => {
	if (file) {
		updateValue(file);
	} else {
		clearValue();
	}
};

const onDrop = (event: DragEvent) => {
	const files = event.dataTransfer?.files;
	if (files && files.length > 0 && files[0]) {
		updateValue(files[0]);
	}
};
</script>

<template>
	<ControlText :question="question" />

	<Panel>
		<template #header>
			<template v-if="mediaType === 'image'">
				<UploadImageHeader :question="question" :accept="accept" :is-disabled="isDisabled" @change="onChange" />
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
		</template>
		<template #default>
			<div class="drag-and-drop" :class="{ 'disabled': isDisabled }" @drop.prevent.stop="onDrop" @dragover.prevent>
				<div v-if="question.currentState.value" class="upload-content">
					<template v-if="fileType === 'image'">
						<UploadImagePreview :image="objectURL" />
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
					<Button v-if="!isDisabled" severity="secondary" outlined class="clear-button" @click="clearValue">
						<IconSVG name="mdiClose" variant="muted" size="sm" />
					</Button>
				</div>
				<!-- TODO: translations -->
				<Message
					v-else-if="fileError"
					severity="error"
					:closable="true"
					@close="fileError = null"
				>
					{{ fileError }}
				</Message>
				<div v-else class="placeholder">
					Drag and drop files here to upload
				</div>
			</div>
		</template>
	</Panel>

	<DeleteConfirmDialog
		v-model:visible="confirmDeleteAction"
		@delete-file="clearValueConfirmed"
	/>
</template>

<style scoped lang="scss">
.p-panel {
	background: var(--odk-base-background-color);
	box-shadow: none;
	border: 1px solid var(--odk-border-color);

	:deep(.p-panel-header) {
		border-radius: var(--odk-radius) var(--odk-radius) 0 0;
		background: var(--odk-light-background-color);
		justify-content: flex-start;
		gap: var(--odk-spacing-xl);
	}

	:deep(.p-panel-content-container) {
		.p-panel-content {
			border-top: 1px solid var(--odk-border-color);
			padding: 0;
		}
		.upload-content.disabled {
			color: var(--odk-muted-text-color);
		}
	}
}

.upload-content {
	display: flex;
	align-items: center;
	gap: var(--odk-spacing-l);

	button {
		align-self: flex-start;
	}
}

.drag-and-drop {
	padding: var(--odk-spacing-xxl);

	&.disabled {
		color: var(--odk-muted-text-color);
	}
	.placeholder {
		text-align: center;
	}
}
</style>
