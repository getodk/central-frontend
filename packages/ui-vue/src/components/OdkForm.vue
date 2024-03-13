<template>
	<div class="odk-form">
		<div class="form-wrapper">
			<FormMenuBar />
			<Card>
				<template #content>
					<h1>Health Survey</h1>
				</template>
			</Card>
			<h1>ODK Form</h1>

			<p>XForm XML:</p>
			<pre>{{ xform }}</pre>
		</div>		
	</div>	
</template>

<script setup lang="ts">
import Card from 'primevue/card';
import FormMenuBar from './FormMenuBar.vue';
defineProps<{ xform: string }>();
</script>

<style lang="scss" scoped>
.odk-form {
	width: 100%;

	.form-wrapper {
		max-width: 800px;
		margin: 10px auto;

		.p-card{
			margin-top: 10px;
			border-top: none;

			:deep(.p-card-content){
				padding: 0 10px;

				h1 {
					margin: 10px 0;
				}
			}
		}
	}
}
pre {
	background-color: black;
	color: white;
	padding: 10px;
	overflow: auto;
}
</style>
