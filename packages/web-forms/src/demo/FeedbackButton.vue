<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

defineOptions({
	name: 'FeedbackButton',
});

const route = useRoute();

const surveyLink = computed(() => {
	const query: Record<string, string> = {
		st: '1jPMSRgwyUHS2ec4zY5XxSWnx!JqCJx96jfpzyTWjFWK6ZR2FT!w98T5zpEfIuNp',
		'd[/data/host]': window.location.host,
		'd[/data/page]': route.fullPath,
		'd[/data/version]': __WEB_FORMS_VERSION__,
	};
	const params = new URLSearchParams(query);
	return `https://data.getodk.cloud/-/single/JLdODTs84WWsgibw4JOh0krbDenObgi?${params.toString()}`;
});
</script>

<template>
	<div class="feedback-button">
		<a :href="surveyLink" target="_blank"><span>Feedback</span></a>
	</div>
</template>



<style lang="scss">
.feedback-button span {
	display: block;
	position: fixed;
	background-color: white;
	color: var(--odk-primary-text-color);
	border: 1px solid var(--odk-border-color);
	right: 0;
	bottom: 150px;
	height: 4rem;
	z-index: 99999;
	border-top-left-radius: var(--odk-radius);
	border-top-right-radius: var(--odk-radius);
	text-align: center;
	line-height: 2rem;
	cursor: pointer;
	font-size: var(--odk-base-font-size);
	padding: 0 1.25rem;
	transform: translateX(50%) rotate(-90deg);
	transition: right 0.25s;
}

.feedback-button span:hover,
.feedback-button:focus-within span {
	right: 10px;
}
</style>
