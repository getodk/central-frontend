<template>
	<div v-if="isDev()">
		Unsupported field {<strong>{{ question.nodeType }}</strong>} in the form definition.
	</div>
</template>

<script setup lang="ts">
import type { AnyLeafNode } from '@odk-web-forms/xforms-engine';

defineProps<{question: AnyLeafNode}>();

const isDev = () => {
	return import.meta.env.DEV;
}
</script>

<style scoped>

</style>