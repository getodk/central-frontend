<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import ImageBlock from '@/components/common/media/ImageBlock.vue';
import type { ObjectURL } from '@getodk/common/lib/web-compat/url.ts';
import { createObjectURL, revokeObjectURL } from '@getodk/common/lib/web-compat/url.ts';
import type { UploadNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import { computed } from 'vue';

export interface UploadImagePreviewProps {
	readonly question: UploadNode;
	readonly isDisabled: boolean;
}

defineEmits(['clear']);
const props = defineProps<UploadImagePreviewProps>();

const imageURL = computed((previous: ObjectURL | null = null) => {
	if (previous != null) {
		revokeObjectURL(previous);
	}

	const file = props.question.currentState.value;
	if (file == null) {
		return null;
	}

	return createObjectURL(file);
});
</script>

<template>
	<div v-if="imageURL" class="preview-captured-image">
		<Button v-if="!isDisabled" severity="secondary" outlined class="clear-button" @click="$emit('clear')">
			<IconSVG name="mdiClose" variant="muted" size="sm" />
		</Button>
		<!-- TODO Add form edit support. Ref: https://github.com/getodk/web-forms/issues/392 -->
		<ImageBlock :blob-url="imageURL" alt="Captured image preview" />
	</div>
</template>

<style scoped lang="scss">
@use '../../../assets/styles/buttons' as btn;

.preview-captured-image {
	position: relative;
	width: fit-content;
	height: fit-content;
	margin-top: 20px;
	overflow: hidden;
	border-radius: var(--odk-radius);

	.clear-button {
		@include btn.clear-button;
		top: 10px;
		right: 10px;
		z-index: var(--odk-z-index-form-floating);
	}

	.media-block {
		background: var(--odk-muted-background-color);
		min-width: var(--odk-image-container-size);
		height: var(--odk-max-image-height);
		justify-content: center;
	}
}

/**
 * Below overrides PrimeVue style
 */

.p-button.clear-button {
	min-width: 0;
	padding: 12px;
	border-radius: var(--odk-radius);

	&:not(:disabled):active,
	&:not(:disabled):hover {
		border-color: var(--odk-inactive-background-color);
	}
}
</style>
