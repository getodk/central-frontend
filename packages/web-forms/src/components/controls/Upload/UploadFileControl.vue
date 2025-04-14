<script setup lang="ts">
import type { UploadNode } from '@getodk/xforms-engine';

export interface UploadFileControlProps {
	readonly question: UploadNode;
}

defineProps<UploadFileControlProps>();
</script>

<template>
	<p>🚧 Support for non-image uploads is pending. 🚧</p>
</template>
