<script setup lang="ts">
import {
	parseGeoJSONGeometry,
	getGeometryFromJSON,
} from '@/components/common/map/geojson-parsers.ts';
import type { SingleFeatureType } from '@/components/common/map/getModeConfig.ts';
import { getValidCoordinates } from '@/components/common/map/map-helpers.ts';
import type { Geometry, LineString, Point, Polygon } from 'geojson';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import IconSVG from '@/components/common/IconSVG.vue';
import { ref, watch } from 'vue';

const props = defineProps<{
	visible: boolean;
	singleFeatureType?: SingleFeatureType;
}>();

const emit = defineEmits(['update:visible', 'save']);

const pasteValue = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isParsing = ref(false);
const pasteError = ref<string | null>(null);
const uploadError = ref<string | null>(null);

const openFileChooser = () => {
	reset();
	fileInput.value?.click();
};

const selectFile = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	if (file) {
		selectedFile.value = file;
	}
};

const parseFileCoordinates = async (file: File): Promise<Geometry | undefined> => {
	try {
		const text = await file.text();
		if (!text?.trim()?.length) {
			// TODO: translations
			setUploadErrorIfBlank('File is empty.');
			return;
		}

		const fileName = file.name.toLowerCase();
		if (fileName.endsWith('.geojson')) {
			return getGeometryFromJSON(text);
		}

		// TODO: translations
		setUploadErrorIfBlank('Unsupported file type. Please upload a .geojson file.');
	} catch {
		// TODO: translations
		setUploadErrorIfBlank('Failed to parse file. Ensure it is a valid GeoJSON.');
	}
};

const parsePastedValue = () => {
	const value = pasteValue.value.trim();
	if (!value.length) {
		return;
	}

	return parseGeoJSONGeometry(value);
};

const save = async () => {
	resetErrors();
	isParsing.value = true;
	let geometry;
	if (selectedFile.value) {
		geometry = await parseFileCoordinates(selectedFile.value);
	} else if (pasteValue.value.length) {
		geometry = parsePastedValue();
	}

	const coordinates = getValidCoordinates(
		geometry as LineString | Point | Polygon | undefined,
		props.singleFeatureType
	);
	isParsing.value = false;

	// TODO: translations
	const errorMessage = 'Incorrect geometry type.';
	if (!coordinates?.length && selectedFile.value) {
		setUploadErrorIfBlank(errorMessage);
		return;
	}

	if (!coordinates?.length && pasteValue.value.length) {
		setPasteErrorIfBlank(errorMessage);
		return;
	}

	close();
	emit('save', coordinates);
};

const close = () => {
	reset();
	emit('update:visible', false);
};

const reset = () => {
	pasteValue.value = '';
	isParsing.value = false;
	resetSelectedFile();
	resetErrors();
};

const resetSelectedFile = () => {
	selectedFile.value = null;
	if (fileInput.value) {
		fileInput.value.value = '';
	}
};

const resetErrors = () => {
	pasteError.value = null;
	uploadError.value = null;
};

const setUploadErrorIfBlank = (message: string) => (uploadError.value ??= message);

const setPasteErrorIfBlank = (message: string) => (pasteError.value ??= message);

watch(pasteValue, (newVal) => {
	resetErrors();
	if (newVal && selectedFile.value) {
		resetSelectedFile();
	}
});
</script>

<template>
	<Dialog
		:visible="visible"
		modal
		class="map-paste-dialog"
		:draggable="false"
		@update:visible="emit('update:visible', $event)"
		@after-hide="reset"
	>
		<template #header>
			<!-- TODO: translations -->
			<strong>Import data to replace location</strong>
		</template>

		<template #default>
			<div class="dialog-field-container">
				<!-- TODO: translations -->
				<label for="paste-input">
					<span>Paste data in ODK format</span>
					<span
						class="info-helper"
						title="Enter as: Lat Long Alt Acc (e.g. 45.5 -122.6 15 2; 45.6 -122.7 12 3)"
					>
						&#9432;
					</span>
				</label>
				<Textarea
					id="paste-input"
					v-model="pasteValue"
					:disabled="isParsing"
					auto-resize
					rows="1"
				/>
				<p v-if="pasteError?.length" class="coords-error-message">
					{{ pasteError }}
				</p>
			</div>

			<div class="dialog-field-container">
				<!-- TODO: translations -->
				<label>Upload a GeoJSON file</label>
				<!-- TODO: translations -->
				<div v-if="selectedFile" class="file-added-container">
					<IconSVG name="mdiFileOutline" />
					<span class="file-name">{{ selectedFile.name }}</span>
					<IconSVG class="clear-file" name="mdiClose" variant="muted" size="sm" @click="reset" />
				</div>
				<p v-if="uploadError?.length" class="coords-error-message">
					{{ uploadError }}
				</p>
				<Button
					class="upload-button"
					outlined
					severity="contrast"
					:disabled="isParsing"
					@click="openFileChooser"
				>
					<IconSVG name="mdiUpload" />
					<!-- TODO: translations -->
					<span>Upload file</span>
				</Button>

				<input
					ref="fileInput"
					type="file"
					accept=".geojson,application/json"
					@change="selectFile"
				>
			</div>
		</template>

		<template #footer>
			<Button label="Save" :disabled="!selectedFile && !pasteValue.length" @click="save" />
		</template>
	</Dialog>
</template>

<style scoped lang="scss">
.dialog-field-container {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 10px;

	label {
		font-size: var(--odk-base-font-size);
		color: var(--odk-text-color);
	}

	input[type='file'] {
		display: none;
	}

	.upload-button {
		margin-top: 10px;
	}

	.info-helper {
		font-size: var(--odk-hint-font-size);
		font-weight: bold;
		cursor: pointer;
	}

	#paste-input {
		width: 100%;
		padding: 10px;
	}
}

.coords-error-message {
	display: block;
	color: var(--odk-error-text-color);
	margin: 0;
}

.file-added-container {
	display: flex;
	align-items: center;
	gap: 10px;
	border: 1px solid var(--odk-border-color);
	border-radius: var(--odk-radius);
	padding: 10px;

	.file-name {
		flex: 1 1 100px;
	}

	.clear-file {
		cursor: pointer;
	}
}
</style>

<style lang="scss">
// Global overrides for this dialog
.p-dialog.map-paste-dialog {
	background: var(--odk-base-background-color);
	border-radius: var(--odk-radius);
	margin: 0 24px;
	width: 550px;

	.p-dialog-header {
		padding: 15px 20px;
		font-size: var(--odk-dialog-title-font-size);
	}

	.p-dialog-content {
		display: flex;
		flex-direction: column;
		gap: 35px;
		padding: 20px;
	}

	.p-dialog-footer button {
		font-size: var(--odk-base-font-size);
		&:disabled {
			cursor: not-allowed;
		}
	}

	button.p-button-secondary:focus-visible {
		outline: none;
		outline-offset: unset;
	}
}
</style>
