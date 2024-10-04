<script setup lang="ts">
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import { computed } from 'vue';
import type { InitializeFormFailure } from '../../lib/error/FormLoadFailure.ts';

/**
 * @todo translations
 */
const FORM_LOAD_ERROR_TEXT = {
	DIALOG_TITLE: 'An error occurred while loading this form',
	DETAILS_SUMMARY_LABEL: 'Technical error details',
};

interface FormLoadErrorProps {
	readonly error: InitializeFormFailure;
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
			<Message severity="error" class="message" :closable="false">
				{{ error.message }}
			</Message>

			<details v-if="detail != null" class="initialize-form-failure-details">
				<summary>{{ FORM_LOAD_ERROR_TEXT.DETAILS_SUMMARY_LABEL }}</summary>

				<pre v-if="detail.unknownCauseDetail != null">{{
				detail.unknownCauseDetail
				}}</pre>

				<pre v-if="detail.stack != null">{{
				detail.stack
				}}</pre>
			</details>
		</div>
	</Dialog>
</template>

<style scoped>
.form-load-failure-dialog .content {
	width: calc(100dvw - 6rem) !important;
}

.form-load-failure-dialog .message {
	margin-top: 0;
}

.initialize-form-failure-details {
	display: block;
	position: relative;
	max-width: 100%;
	overflow: auto;
}

.initialize-form-failure-details summary {
	cursor: pointer;
}
</style>
