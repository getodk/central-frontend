<template>
	<Card class="form-title">
		<template #content>
			<h1>{{ title }}</h1>
			<!-- last saved timestamp -->
		</template>
	</Card>
</template>

<script setup lang="ts">
import Card from 'primevue/card';
defineProps<{title: string}>();
</script>