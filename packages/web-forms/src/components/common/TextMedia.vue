<script setup lang="ts">
import ImageBlock from '@/components/common/ImageBlock.vue';
import type { TextRange } from '@getodk/xforms-engine';
import { computed } from 'vue';
import MarkdownBlock from './MarkdownBlock.vue';

interface TextMediaProps {
	readonly label: TextRange<'item-label'>;
}

const props = defineProps<TextMediaProps>();

const text = computed(() => props.label.formatted);
const alt = computed(() => props.label.asString);
const image = computed(() => props.label.imageSource);
const video = computed(() => props.label.videoSource);
const audio = computed(() => props.label.audioSource);
</script>

<template>
	<span v-if="text != null" class="text-content">
		<MarkdownBlock v-for="(elem, index) in text" :key="index" :elem="elem" />
	</span>

	<div v-if="image || video || audio" class="media-content">
		<ImageBlock v-if="image" :resource-url="image" :alt="alt" />

		<!-- TODO: Implement VideoBlock component -->
		<span v-else-if="video">🚧 Video media type is not supported</span>

		<!-- TODO: Implement AudioBlock component -->
		<span v-else-if="audio">🚧 Video media type is not supported</span>
	</div>
</template>

<style scoped lang="scss">
.text-content {
	margin-left: 0;
}
</style>
