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
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import { inject, ref, watch } from 'vue';

const props = defineProps<{
	visible: boolean;
	singleFeatureType?: SingleFeatureType;
}>();

const emit = defineEmits(['update:visible', 'save']);

const t: Translate = inject(TRANSLATE)!;

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
			setUploadErrorIfBlank(t('map_update_coords_dialog.file_empty.error'));
			return;
		}

		const fileName = file.name.toLowerCase();
		if (fileName.endsWith('.geojson')) {
			return getGeometryFromJSON(text);
		}

		setUploadErrorIfBlank(t('map_update_coords_dialog.unsupported_file.error'));
	} catch {
		setUploadErrorIfBlank(t('map_update_coords_dialog.parse_failed.error'));
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

	const errorMessage = t('map_update_coords_dialog.incorrect_geometry.error');
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
			<strong>{{ t('map_update_coords_dialog.header.title') }}</strong>
		</template>

		<template #default>
			<div class="dialog-field-container">
				<label for="paste-input">
					<span>{{ t('map_update_coords_dialog.paste_data.label') }}</span>
					<span class="info-helper">
						{{ t('map_update_coords_dialog.paste_data.hint') }}
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
				<label>{{ t('map_update_coords_dialog.upload_file.label') }}</label>
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
					<span>{{ t('map_update_coords_dialog.upload_file.action') }}</span>
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
			<Button :label="t('odk_web_forms.save.label')" :disabled="!selectedFile && !pasteValue.length" @click="save" />
		</template>
	</Dialog>
</template>

<style scoped lang="scss">
.dialog-field-container {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: var(--odk-spacing-m);

	label {
		font-size: var(--odk-base-font-size);
		color: var(--odk-text-color);
	}

	input[type='file'] {
		display: none;
	}

	.upload-button {
		margin-top: var(--odk-spacing-m);
	}

	.info-helper {
		display: block;
		font-size: var(--odk-hint-font-size);
		color: var(--odk-muted-text-color);
		font-weight: 300;
	}

	#paste-input {
		width: 100%;
		padding: var(--odk-spacing-m);
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
	gap: var(--odk-spacing-m);
	border: 1px solid var(--odk-border-color);
	border-radius: var(--odk-radius);
	padding: var(--odk-spacing-m);

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
	width: 550px;

	.p-dialog-content {
		display: flex;
		flex-direction: column;
		gap: 35px;
	}
}
</style>
