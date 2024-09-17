<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

defineOptions({
	name: 'FeedbackButton',
});

const route = useRoute();

const surveyLink = computed(() => {
	const query: Record<string, string> = {
		st: '9hflqGrodnpWyS8g69dbORJ3RD8jSQChTBMaf7zpE5gaPElyDtKgAjI79y$zqctG',
		'd[/data/host]': window.location.host,
		'd[/data/page]': route.fullPath,
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
	color: var(--primary-500);
	border: 2px solid var(--gray-300);
	right: 0;
	bottom: 150px;
	height: 4rem;
	z-index: 99999;
	border-top-left-radius: 5px;
	border-top-right-radius: 5px;
	text-align: center;
	line-height: 2rem;
	cursor: pointer;
	font-size: 1rem;
	padding: 0 1.25rem;
	transform: translateX(50%) rotate(-90deg);
	transition: right 0.25s;
}

.feedback-button span:hover,
.feedback-button:focus-within span {
	right: 10px;
}
</style>
