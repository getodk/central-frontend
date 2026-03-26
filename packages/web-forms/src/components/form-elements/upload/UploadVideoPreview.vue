<script setup lang="ts">
import { ref, watchEffect } from 'vue';

type ObjectURL = `blob:${string}`;

export interface UploadVideoPreviewProps {
	readonly video: ObjectURL | null;
}

const mediaUrl = ref<ObjectURL | undefined>();

const props = defineProps<UploadVideoPreviewProps>();

watchEffect(() => {
	if (props.video != null) {
		mediaUrl.value = props.video;
		return;
	}
});
</script>

<template>
	<div v-if="mediaUrl">
		<video controls :src="mediaUrl" />
	</div>
</template>

<style scoped lang="scss">
video {
	width: 100%;
	max-height: var(--odk-max-image-height);
	border-radius: var(--odk-radius);
}
</style>
