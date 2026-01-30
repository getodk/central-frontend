<script setup lang="ts">
import MediaBlockBase from '@/components/common/media/MediaBlockBase.vue';
import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';

defineProps<{
	readonly resourceUrl: JRResourceURL;
	readonly alt: string;
}>();
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
			@error="reportError(new Error(`Failed to load video. File: ${resourceUrl.href}`))"
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
