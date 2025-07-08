<script setup lang="ts">
withDefaults(defineProps<{ message?: string; showMessage: boolean; addPlaceholder?: boolean }>(), {
	message: undefined,
	showMessage: false,
	addPlaceholder: true,
});
</script>

<template>
	<div :class="{ 'validation-placeholder': addPlaceholder }">
		<span v-show="showMessage" class="validation-message">
			{{ message }}
		</span>
	</div>
</template>

<style scoped lang="scss">
.validation-placeholder {
	min-height: 2rem;
}
.validation-message {
	color: var(--odk-error-text-color);
	margin-top: 0.6rem;
	display: block;
}
</style>
