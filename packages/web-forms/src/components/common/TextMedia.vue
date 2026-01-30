<script setup lang="ts">
import AudioBlock from '@/components/common/media/AudioBlock.vue';
import ImageBlock from '@/components/common/media/ImageBlock.vue';
import VideoBlock from '@/components/common/media/VideoBlock.vue';
import type { TextRange } from '@getodk/xforms-engine';
import { computed } from 'vue';
import MarkdownBlock from './MarkdownBlock.vue';

interface TextMediaProps {
	readonly label: TextRange<'item-label'>;
	readonly audioIconsOnly?: boolean;
}

const props = defineProps<TextMediaProps>();

const text = computed(() => props.label.formatted);
const alt = computed(() => props.label.asString);
const image = computed(() => props.label.imageSource);
const video = computed(() => props.label.videoSource);
const audio = computed(() => props.label.audioSource);
</script>

<template>
	<span v-if="text != null" class="text-content" :class="{ 'audio-icons-only': audioIconsOnly }">
		<MarkdownBlock v-for="elem in text" :key="elem.id" :elem="elem" />
		<AudioBlock v-if="audio && audioIconsOnly" :resource-url="audio" :alt="alt" variant="icons" />
	</span>

	<div v-if="image || video || audio" class="media-content">
		<ImageBlock v-if="image" :resource-url="image" :alt="alt" />
		<AudioBlock v-if="audio && !audioIconsOnly" :resource-url="audio" :alt="alt" />
		<VideoBlock v-if="video" :resource-url="video" :alt="alt" />
	</div>
</template>

<style scoped lang="scss">
.text-content {
	margin-left: 0;
}

.text-content.audio-icons-only {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px;
}
</style>
