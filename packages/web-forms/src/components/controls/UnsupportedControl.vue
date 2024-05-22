<script setup lang="ts">
import type { AnyLeafNode } from '@getodk/xforms-engine';

defineProps<{question: AnyLeafNode}>();

const isDev = () => {
	return import.meta.env.DEV;
}
</script>
<template>
	<div v-if="isDev()">
		Unsupported field {<strong>{{ question.nodeType }}</strong>} in the form definition.
	</div>
</template>

