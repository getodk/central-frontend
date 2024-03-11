<script setup lang="ts">
defineProps<{ xform: string }>();
</script>

<template>
	<h1>ODK Form</h1>

	<p>XForm XML:</p>
	<pre>{{ xform }}</pre>
</template>

<style scoped>
pre {
	background-color: black;
	color: white;
	padding: 10px;
}
</style>
