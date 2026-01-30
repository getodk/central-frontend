<script setup lang="ts">
import { FORM_MEDIA_CACHE, FORM_OPTIONS } from '@/lib/constants/injection-keys.ts';
import type { FormOptions } from '@/lib/init/load-form-state.ts';
import type {
	JRResourceURL,
	JRResourceURLString,
} from '@getodk/common/jr-resources/JRResourceURL.ts';
import { createObjectURL, type ObjectURL } from '@getodk/common/lib/web-compat/url.ts';
import { computed, inject, ref, watchEffect } from 'vue';

const props = defineProps<{
	readonly resourceUrl?: JRResourceURL;
	readonly blobUrl?: ObjectURL;
	readonly alt: string;
	readonly brokenFileImage: string;
	readonly variant?: 'fit-content' | 'full-width' | 'small-fixed';
}>();

const formOptions = inject<FormOptions>(FORM_OPTIONS);
const mediaCache = inject<Map<JRResourceURLString, ObjectURL>>(FORM_MEDIA_CACHE, new Map());
const loading = ref<boolean>(true);
const mediaUrl = ref<string>('');
const errorMessage = ref<string>('');
const brokenFileSrc = computed(() => {
	if (!props.brokenFileImage) {
		return '';
	}

	return new URL(`../../../assets/images/${props.brokenFileImage}`, import.meta.url).href;
});

const loadMedia = async (src?: JRResourceURL): Promise<void> => {
	if (src?.href == null || formOptions?.fetchFormAttachment == null) {
		// TODO: translations
		handleError(new Error('Cannot fetch media. Verify the URL and fetch settings.'));
		return;
	}

	try {
		const cache = mediaCache.get(src.href);
		if (cache != null) {
			setMedia(cache);
			return;
		}

		const response = await formOptions.fetchFormAttachment(src);
		if (!response.ok || response.status !== 200) {
			// TODO: translations
			handleError(new Error(`Media not found. File: ${src.href}`));
			return;
		}

		const data = await response.blob();
		const url = createObjectURL(data);
		mediaCache.set(src.href, url);
		setMedia(url);
	} catch {
		// TODO: translations
		handleError(new Error(`Cannot fetch media. Unknown error. File: ${src.href}`));
	}
};

const setMedia = (value: string) => {
	mediaUrl.value = value;
	loading.value = false;
};

const handleError = (error: Error) => {
	loading.value = false;
	mediaUrl.value = '';
	errorMessage.value = error.message;
};

watchEffect(() => {
	errorMessage.value = '';

	if (props.blobUrl != null) {
		setMedia(props.blobUrl);
		return;
	}

	void loadMedia(props.resourceUrl);
});
</script>

<template>
	<div
		class="media-block"
		:class="{
			'fit-content': !variant || variant === 'fit-content',
			'small-fixed': variant === 'small-fixed',
			'full-width': variant === 'full-width',
			'broken-file': errorMessage?.length,
		}"
	>
		<slot
			v-if="!loading && !errorMessage?.length"
			:media-url="mediaUrl"
			:report-error="handleError"
		/>

		<div v-if="loading" class="skeleton-loading" />

		<template v-if="errorMessage?.length">
			<img :src="brokenFileSrc" :alt="alt">
			<p class="media-error-message">
				{{ errorMessage }}
			</p>
		</template>
	</div>
</template>

<style scoped lang="scss">
.media-block {
	display: flex;
	align-items: center;
	flex-direction: column;
	position: relative;
	overflow: hidden;
	width: 100%;
	border-radius: var(--odk-radius);

	&.full-width {
		width: 100%;
	}

	&.small-fixed {
		max-width: var(--odk-image-container-size);
	}

	&.fit-content {
		width: fit-content;
	}

	&.broken-file {
		max-width: var(--odk-image-container-size);

		img {
			max-width: 90%;
			margin-top: 10px;
		}
	}

	.media-error-message {
		margin: 20px;
		font-size: var(--odk-hint-font-size);
		font-weight: 300;
		word-break: break-word;
		text-align: center;
		color: var(--odk-muted-text-color);
	}

	.skeleton-loading {
		min-width: 300px;
		min-height: 300px;
	}
}
</style>
