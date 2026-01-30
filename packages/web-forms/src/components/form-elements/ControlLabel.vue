<script setup lang="ts">
import AudioBlock from '@/components/common/media/AudioBlock.vue';
import ImageBlock from '@/components/common/media/ImageBlock.vue';
import MarkdownBlock from '@/components/common/MarkdownBlock.vue';
import VideoBlock from '@/components/common/media/VideoBlock.vue';
import type { AnyControlNode as QuestionNode } from '@getodk/xforms-engine';
import { computed } from 'vue';

const { question } = defineProps<{ question: QuestionNode }>();

const text = computed(() => question.currentState.label?.formatted);
const alt = computed(() => question.currentState.label?.asString ?? '');
const image = computed(() => question.currentState.label?.imageSource);
const video = computed(() => question.currentState.label?.videoSource);
const audio = computed(() => question.currentState.label?.audioSource);
</script>

<template>
	<label :for="question.nodeId" :class="{ required: question.currentState.required }">
		<MarkdownBlock v-for="elem in text" :key="elem.id" :elem="elem" />
		<div v-if="image || video || audio" class="media-content">
			<ImageBlock v-if="image" :resource-url="image" :alt="alt" />
			<AudioBlock v-if="audio" :resource-url="audio" :alt="alt" />
			<VideoBlock v-if="video" :resource-url="video" :alt="alt" />
		</div>
	</label>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

label {
	font-weight: 400;
	font-size: var(--odk-question-font-size);
	line-height: 1.5rem;
	word-wrap: break-word;
	display: inline-block;
	width: 100%;

	&.required::before {
		content: '*';
		color: var(--odk-error-text-color);
		float: left;
		margin-right: 5px;
	}

	:first-child {
		margin-top: 0;
	}

	.media-content {
		margin-top: 15px;
		max-width: 400px;
		display: flex;
		gap: 20px;
		flex-direction: column;
		align-items: flex-start;
	}
}

@media screen and (max-width: #{pf.$sm}) {
	label .media-content {
		width: auto;
	}
}
</style>
