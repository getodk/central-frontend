<script setup lang="ts">
import type { UploadNode } from '@getodk/xforms-engine';
import UploadFileControl from './UploadFileControl.vue';
import UploadImageControl from './UploadImageControl.vue';

export interface UploadControlProps {
	readonly question: UploadNode;
}

defineProps<UploadControlProps>();
</script>

<template>
	<template v-if="question.nodeOptions.media.type === 'image'">
		<UploadImageControl :question="question" />
	</template>
	<template v-else>
		<UploadFileControl :question="question" />
	</template>
</template>
