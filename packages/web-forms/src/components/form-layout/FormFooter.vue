<script setup lang="ts">
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import type { RootNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import { inject } from 'vue';

defineProps<{ root: RootNode }>();
defineEmits<{ submit: [] }>();
const t: Translate = inject(TRANSLATE)!;
</script>

<template>
	<div class="form-footer flex flex-wrap gap-3">
		<Button
			v-if="root.currentState.canGoPrevious"
			outlined
			severity="contrast"
			:label="t('odk_web_forms.back.label')"
			@click="root.previousPage()"
		/>
		<Button
			v-if="root.currentState.canGoNext"
			class="primary-action"
			:label="t('odk_web_forms.next.label')"
			@click="root.nextPage()"
		/>
		<!-- canGoNext is false on the last page and always on non-paginated forms; Send takes Next's place in both. -->
		<Button
			v-else
			class="primary-action"
			:label="t('odk_web_forms.submit.label')"
			@click="$emit('submit')"
		/>
	</div>
</template>

<style scoped lang="scss">
.form-footer {
	margin-top: 1.5rem;

	button {
		min-width: 160px;
	}

	.primary-action {
		margin-left: auto;
	}
}
</style>
