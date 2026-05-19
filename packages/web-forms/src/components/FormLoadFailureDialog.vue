<script setup lang="ts">
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import { computed, inject } from 'vue';
import type { FormInitializationError } from '@/lib/error/FormInitializationError.ts';

interface FormLoadErrorProps {
	readonly error: FormInitializationError;
}

const props = defineProps<FormLoadErrorProps>();
const t: Translate = inject(TRANSLATE)!;

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
		:header="t('form_load_failure_dialog.header.title')"
		:closable="false"
		:draggable="false"
		:keep-in-viewport="true"
	>
		<div class="content">
			<Message severity="error" class="message" :closable="false" :unstyled="true">
				{{ error.message }}
			</Message>

			<details v-if="detail != null" class="initialize-form-failure-details">
				<summary>{{ t('form_load_failure_dialog.details.label') }}</summary>

				<pre v-if="detail.unknownCauseDetail != null">{{ detail.unknownCauseDetail }}</pre>

				<pre v-if="detail.stack != null">{{ detail.stack }}</pre>
			</details>
		</div>
	</Dialog>
</template>

<style lang="scss" scoped>
.form-load-failure-dialog .message {
	margin: var(--odk-spacing-m) 0 var(--odk-spacing-xxl) 0;
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

.p-dialog.form-load-failure-dialog {
	width: 50vw;
}

@media screen and (max-width: #{pf.$sm}) {
	.p-dialog.form-load-failure-dialog {
		width: 80vw;
	}
}
</style>
