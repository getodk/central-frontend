<script setup lang="ts">
import { ref, watchEffect } from 'vue';

type ObjectURL = `blob:${string}`;

export interface UploadAudioPreviewProps {
	readonly audio: ObjectURL | null;
}

const mediaUrl = ref<ObjectURL | undefined>();

defineEmits(['clear']);
const props = defineProps<UploadAudioPreviewProps>();

watchEffect(() => {
	if (props.audio != null) {
		mediaUrl.value = props.audio;
		return;
	}
});
</script>

<template>
	<div>
		<audio v-if="mediaUrl" controls :src="mediaUrl" />
	</div>
</template>

<style scoped lang="scss">
div {
	min-height: var(--odk-audio-height);
	width: 100%;
	max-width: 400px;

	audio {
		width: 100%;
	}
}
</style>
