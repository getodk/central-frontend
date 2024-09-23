<script setup lang="ts">
import PrimeButton from 'primevue/button';
import PrimeProgressSpinner from 'primevue/progressspinner';
import { RouterLink } from 'vue-router';

import PrimeIconField from 'primevue/iconfield';
import PrimeInputIcon from 'primevue/inputicon';
import PrimeInputText from 'primevue/inputtext';
import PrimeMessage from 'primevue/message';

import { computed, ref, watch, type HTMLInputElementEvent } from 'vue';
import { useConfiguration } from './composables/configuration';
import { useXlsFormOnline } from './composables/xlsform-online';

const fileInput = ref();
const highlighted = ref(false);
const uploadedFilename = ref('');

const xformUrl = ref<string | null>(null);

const error = ref<string>('');
const warnings = ref<string[]>([]);

const formUploading = ref<boolean>(false);

const { data: config, error: configErrors } = useConfiguration();

const xlsformOnlineBaseUrl = computed(() => config.value?.['xlsform-online-url']);

watch(configErrors, (value) => {
	if (value) {
		error.value =
			'Failed to load configuration, please refresh the page. If problem persists, please report it on ODK Forum.';
	}
});

const { convertXlsForm } = useXlsFormOnline(xlsformOnlineBaseUrl);

const fileChangeHandler = async (e: HTMLInputElementEvent) => {
	if (e.target?.files?.length == 1) {
		await uploadFile(e.target.files[0]);
	}
};

const getFileExtension = (filename: string) => {
	const parts = filename.split('.');
	return parts.length > 1 ? parts.pop()! : '';
};

const fileDropHandler = async (e: DragEvent) => {
	highlighted.value = false;

	// short-circuit if a file is being uploaded
	if (formUploading.value) {
		return;
	}

	if (!e.dataTransfer || e.dataTransfer.files.length == 0) {
		return;
	}

	if (e.dataTransfer.files.length > 1) {
		error.value = 'You can upload only one file at a time.';
		return;
	}

	if (!['xlsx', 'xls', 'xml'].includes(getFileExtension(e.dataTransfer.files[0].name))) {
		error.value = 'Please upload an Excel file (.xls or .xlsx).';
		return;
	}

	await uploadFile(e.dataTransfer.files[0]);
};

const uploadFile = async (file: File) => {
	formUploading.value = true;
	reset();
	uploadedFilename.value = file.name;

	const { data: response, error: conversionError } = await convertXlsForm(file);

	if (conversionError) {
		error.value = conversionError;
	} else if (response) {
		if (response.error) {
			error.value = response.error;
		} else if (response.xform_url) {
			xformUrl.value = response.xform_url;
		}

		if (response.warnings && response.warnings.length > 0) {
			warnings.value = response.warnings;
		}
	}

	formUploading.value = false;
};

const toggleHighlight = () => {
	// short-circuit if a file is being uploaded
	if (formUploading.value) {
		return;
	}

	highlighted.value = !highlighted.value;
};

const reset = () => {
	uploadedFilename.value = '';
	error.value = '';
	warnings.value = [];
	xformUrl.value = null;
};

// Optional: Prevent file drop on rest of the page
document.addEventListener(
	'dragover',
	function (e) {
		e.preventDefault();
	},
	false
);

document.addEventListener(
	'drop',
	function (e) {
		e.preventDefault();
	},
	false
);
</script>

<template>
	<div class="form-upload-component">
		<template v-if="xformUrl == null">
			<div
				:class="{ dropbox: true, highlighted: highlighted }"
				@drop.prevent="fileDropHandler"
				@dragenter.prevent="toggleHighlight"
				@dragleave.prevent="toggleHighlight"
			>
				<template	v-if="!formUploading">
					<input ref="fileInput" type="file" hidden accept=".xls, .xlsx, .xml" @change="fileChangeHandler">
					<span>
						<span class="icon-insert_drive_file" />
						Drag and drop XLSForm or <a href="javascript:;" class="upload-file-link" @click="fileInput.click()">upload file</a>
					</span>
				</template>
				<template v-else>
					<PrimeProgressSpinner class="spinner" />
					<span>
						Uploading form
					</span>
				</template>
			</div>
		</template>

		<div v-else class="preview-wrapper">
			<PrimeIconField icon-position="left" class="textbox-with-icon">
				<PrimeInputIcon class="icon-insert_drive_file" />
				<PrimeInputText :value="uploadedFilename" class="uploaded-file-textbox" />
				<PrimeButton class="clear-button" icon="icon-clear" text rounded aria-label="Cancel" @click="reset()" />
			</PrimeIconField>

			<div class="action-buttons">
				<PrimeButton label="Upload new Form" icon="icon-file_upload" class="upload-new-button" @click="reset" />
				<RouterLink :to="`/form?url=${xformUrl}`" target="_blank" class="preview-link">
					<PrimeButton label="Preview Form" icon="icon-remove_red_eye" class="preview-link-button" />
				</RouterLink>
			</div>
		</div>

		<PrimeMessage v-if="error" severity="error" icon="icon-error" @close="reset()">
			{{ error }}
		</PrimeMessage>
		<PrimeMessage v-if="warnings?.length > 0" severity="warn" icon="icon-warning">
			<span>There are following possible problems in the uploaded Form:</span>
			<ul>
				<li v-for="warning in warnings" :key="warning">
					{{ warning }}
				</li>
			</ul>
		</PrimeMessage>
	</div>
</template>

<style scoped lang="scss">
@import 'primeflex/core/_variables.scss';

.spinner {
	width: 40px;
	height: 40px;
}

.form-upload-component {
	display: flex;
	flex-direction: column;
	gap: 14px;

	.dropbox {
		border: 1px dashed black;
		border-radius: 20px;
		background-color: var(--blue-50);
		height: 110px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		gap: 1rem;
		padding: 0 1rem;
	}

	.dropbox.highlighted {
		border-color: #1a73e8;
		background-color: var(--blue-100);
	}

	a.upload-file-link {
		font-weight: 700;
		color: var(--primary-color);
	}

	.preview-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;

		.textbox-with-icon {
			width: 100%;

			.uploaded-file-textbox {
				width: 100%;
				padding-right: 3rem;
			}

			.clear-button {
				position: absolute;
				margin-top: 3px;
				right: 1rem;
				color: var(--text-color);

				&:hover,
				&:active {
					color: var(--text-color);
				}
			}
		}

		.action-buttons {
			display: flex;
			flex-direction: column;
			flex-wrap: wrap;
			gap: 1rem;
			width: 100%;

			.upload-new-button {
				flex: 1 1 auto;
				text-align: center;
				background-color: var(--secondary-button-background-color);
				color: var(--secondary-button-text-color);

				&:hover,
				&:focus {
					background-color: var(--secondary-button-background-color-hover);
				}
				&:active {
					background-color: var(--secondary-button-background-color-active);
				}
			}

			.preview-link {
				flex: 1 1 auto;

				.preview-link-button {
					width: 100%;
					background-color: var(--primary-button-background-color);

					&:hover,
					&:focus {
						background-color: var(--primary-button-background-color-hover);
					}
					&:active {
						background-color: var(--primary-button-background-color-active);
					}
				}
			}
		}
	}

	:deep(.p-message .p-message-wrapper) {
		padding: 0.5rem 1rem;
		white-space: pre-line;
		align-items: start;

		ul {
			margin-bottom: 0;
			padding-left: 1rem;
		}

		.p-message-icon {
			line-height: 2.5rem;
		}

		.p-message-text {
			min-height: 2.5rem;
			display: flex;
			flex-direction: column;
			justify-content: center;
		}
	}

	:deep(.p-button) {
		.p-button-icon {
			flex-grow: 1;
			text-align: right;
		}
		.p-button-label {
			text-align: left;
		}
	}
}

@media screen and (min-width: #{$md}) {
	.form-upload-component {
		.preview-wrapper {
			.action-buttons {
				flex-direction: row;
			}
		}
	}
}
</style>
