<script setup lang="ts">

export interface UploadControlPreviewProps {
	readonly fileName: string;
}

defineProps<UploadControlPreviewProps>();
</script>

<template>
	<span>{{ fileName }}</span>
</template>
