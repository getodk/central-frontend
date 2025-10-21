<script setup lang="ts">
import ImageBlock from '@/components/common/ImageBlock.vue';
import MarkdownBlock from '@/components/common/MarkdownBlock.vue';
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
		<MarkdownBlock v-for="(elem, index) in text" :key="index" :elem="elem" />
		<div v-if="image || video || audio" class="media-content">
			<ImageBlock v-if="image" :resource-url="image" :alt="alt" />

			<!-- TODO: Implement VideoBlock component -->
			<span v-else-if="video">🚧 Video media type is not supported</span>

			<!-- TODO: Implement AudioBlock component -->
			<span v-else-if="audio">🚧 Video media type is not supported</span>
		</div>
	</label>
</template>

<style scoped lang="scss">
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
}
</style>
