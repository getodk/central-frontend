<script setup lang="ts">
import type { UploadNode } from '@getodk/xforms-engine';

export interface UploadFileControlProps {
	readonly question: UploadNode;
}

defineProps<UploadFileControlProps>();
</script>

<template>
	<!--
		It would probably have taken minimal work to support the general (non-image)
		case for <upload> controls, but the ask was to not do that.
	-->

	<p>🚧 Support for non-image uploads is pending. 🚧</p>
</template>
