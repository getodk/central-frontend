<script setup lang="ts">
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import { computed } from 'vue';
import type { FormInitializationError } from '@/lib/error/FormInitializationError.ts';

/**
 * @todo translations
 */
const FORM_LOAD_ERROR_TEXT = {
	DIALOG_TITLE: 'An error occurred while loading this form',
	DETAILS_SUMMARY_LABEL: 'Technical error details',
};

interface FormLoadErrorProps {
	readonly error: FormInitializationError;
}

const props = defineProps<FormLoadErrorProps>();

interface FormLoadErrorDetail {
	readonly stack: string | null;
	readonly unknownCauseDetail: string | null;
}

const detail = computed((): FormLoadErrorDetail | null => {
	const { stack = null, unknownCauseDetail } = props.error;

	if (stack == null && unknownCauseDetail == null) {
		return null;
	}

	return {
		stack,
		unknownCauseDetail,
	};
});
</script>

<template>
	<Dialog
		class="form-load-failure-dialog"
		:visible="detail != null"
		:header="FORM_LOAD_ERROR_TEXT.DIALOG_TITLE"
		:closable="false"
		:draggable="false"
		:keep-in-viewport="true"
	>
		<div class="content">
			<Message severity="error" class="message" :closable="false" :unstyled="true">
				{{ error.message }}
			</Message>

			<details v-if="detail != null" class="initialize-form-failure-details">
				<summary>{{ FORM_LOAD_ERROR_TEXT.DETAILS_SUMMARY_LABEL }}</summary>

				<pre v-if="detail.unknownCauseDetail != null">{{ detail.unknownCauseDetail }}</pre>

				<pre v-if="detail.stack != null">{{ detail.stack }}</pre>
			</details>
		</div>
	</Dialog>
</template>

<style lang="scss" scoped>
.form-load-failure-dialog .message {
	margin: 10px 0 30px 0;
	color: var(--odk-error-text-color);
	font-size: var(--odk-base-font-size);
	white-space: pre-wrap;
}

.initialize-form-failure-details {
	display: block;
	position: relative;
	max-width: 100%;
	overflow: hidden;
	font-size: var(--odk-base-font-size);
}

.initialize-form-failure-details summary {
	cursor: pointer;
}

.initialize-form-failure-details pre {
	overflow: auto;
}
</style>

<style lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.p-dialog {
	width: 50vw;
}

@media screen and (max-width: #{pf.$sm}) {
	.p-dialog {
		width: 80vw;
	}
}
</style>
