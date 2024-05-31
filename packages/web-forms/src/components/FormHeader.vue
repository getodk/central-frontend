<script setup lang="ts">
import Card from 'primevue/card';
defineProps<{title: string}>();
</script>
<template>
	<Card class="form-title">
		<template #content>
			<h1>{{ title }}</h1>
			<!-- last saved timestamp -->
		</template>
	</Card>
</template>

<style scoped lang="scss">
.form-title {
	border-radius: 10px;
	box-shadow: 0px 1px 3px 1px #00000026;
	border-top: none;
	margin-top: 20px;

	:deep(.p-card-content) {
		padding: 0 1rem;

		h1 {
			font-size: 1.5rem;
			font-weight: 500;
			margin: 10px 0;
		}
	}
}
</style>
