<script setup lang="ts">
import { FORM_MEDIA_CACHE, FORM_OPTIONS, TRANSLATE } from '@getodk/web-forms/lib/constants/injection-keys.ts';
import type { FormOptions } from '@getodk/web-forms/lib/init/load-form-state.ts';
import type { Translate } from '@getodk/web-forms/lib/locale/useLocale.ts';
import type {
	JRResourceURL,
	JRResourceURLString,
} from '@getodk/common/jr-resources/JRResourceURL.ts';
import { computed, inject, onWatcherCleanup, ref, watchEffect } from 'vue';

type ObjectURL = `blob:${string}`;

type MediaResponse = MediaResponseError | MediaResponseSuccess;

interface MediaResponseSuccess {
	ok: true;
	image: ObjectURL;
}

interface MediaResponseError {
	ok: false;
	error: string;
}

const props = defineProps<{
	readonly resourceUrl?: JRResourceURL;
	readonly blobUrl?: ObjectURL;
	readonly alt: string;
	readonly brokenFileImage: string;
	readonly variant?: 'fit-content' | 'full-width' | 'small-fixed';
}>();

const t: Translate = inject(TRANSLATE)!;
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

const fetchMedia = async (src?: JRResourceURL): Promise<MediaResponse> => {
	if (src?.href == null || formOptions?.fetchFormAttachment == null) {
		return { ok: false, error: t('media_block.fetch.error') };
	}

	try {
		const cache = mediaCache.get(src.href);

		if (cache != null) {
			return { ok: true, image: cache };
		}

		const response = await formOptions.fetchFormAttachment(src);
		if (!response.ok || response.status !== 200) {
			return { ok: false, error: t('media_block.not_found.error', { file: src.href }) };
		}

		const data = await response.blob();
		const image = URL.createObjectURL(data) satisfies string as ObjectURL;
		mediaCache.set(src.href, image);
		return { ok: true, image };
	} catch {
		return { ok: false, error: t('media_block.unknown.error', { file: src.href }) };
	}
};

const loadMedia = async (url: JRResourceURL, signal: AbortSignal) => {
	const response = await fetchMedia(url);
	if (signal.aborted) {
		// url has been modified since sending request
		return;
	}
	if (response.ok) {
		setMedia(response.image);
	} else {
		handleError(response.error);
	}
};

const setMedia = (value: ObjectURL) => {
	mediaUrl.value = value;
	loading.value = false;
	errorMessage.value = '';
};

const handleError = (error: string) => {
	loading.value = false;
	mediaUrl.value = '';
	errorMessage.value = error;
};

watchEffect(() => {
	loading.value = true;
	errorMessage.value = '';

	if (props.blobUrl != null) {
		setMedia(props.blobUrl);
		return;
	}

	if (props.resourceUrl != null) {
		const controller = new AbortController();
		onWatcherCleanup(() => {
			controller.abort();
		});

		void loadMedia(props.resourceUrl, controller.signal);
	}
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
		max-width: var(--odk-media-container-size);
	}

	&.fit-content {
		width: fit-content;
	}

	&.broken-file {
		max-width: var(--odk-media-container-size);

		img {
			max-width: 90%;
			margin-top: var(--odk-spacing-m);
		}
	}

	.media-error-message {
		margin: var(--odk-spacing-xl);
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
