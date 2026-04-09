<script setup lang="ts">
import MediaBlockBase from '@/components/common/media/MediaBlockBase.vue';
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import { inject } from 'vue';

defineProps<{
	readonly resourceUrl: JRResourceURL;
	readonly alt: string;
}>();

const t: Translate = inject(TRANSLATE)!;
</script>

<template>
	<MediaBlockBase
		v-slot="{ mediaUrl, reportError }"
		:alt="alt"
		broken-file-image="broken-video.svg"
		:resource-url="resourceUrl"
		variant="full-width"
	>
		<video
			controls
			controlsList="nodownload noplaybackrate"
			:src="mediaUrl"
			:title="alt"
			class="video-block"
			@error="reportError(t('video_block.load.error', { file: resourceUrl.href ?? '' }))"
		/>
	</MediaBlockBase>
</template>

<style scoped lang="scss">
.video-block {
	max-height: fit-content;
	max-width: 400px;
	width: 100%;
	height: auto;
	display: block;
	object-fit: contain;
}
</style>
