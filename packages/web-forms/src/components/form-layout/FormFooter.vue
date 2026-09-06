<script setup lang="ts">
import IconSVG from '@getodk/web-forms/components/common/IconSVG.vue';
import { TRANSLATE } from '@getodk/web-forms/lib/constants/injection-keys.ts';
import type { Translate } from '@getodk/web-forms/lib/locale/useLocale.ts';
import type { RootNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import { inject } from 'vue';

defineProps<{ root: RootNode }>();
defineEmits<{ submit: []; next: [] }>();
const t: Translate = inject(TRANSLATE)!;
</script>

<template>
	<div class="form-footer flex flex-wrap gap-3">
		<Button
			v-if="root.currentState.hasNextPage"
			class="align-right"
			outlined
			severity="contrast"
			@click="$emit('next')"
		>
			<span>{{ t('odk_web_forms.next.label') }}</span>
			<IconSVG name="mdiArrowRight" />
		</Button>
		<!-- hasNextPage is false on the last page and always on non-paginated forms; Send takes Next's place in both. -->
		<Button
			v-else
			class="align-right"
			@click="$emit('submit')"
		>
			<span>{{ t('odk_web_forms.submit.label') }}</span>
			<IconSVG name="mdiSendVariantOutline" variant="inverted" />
		</Button>
		<Button
			v-if="root.currentState.hasPreviousPage"
			class="back-button"
			outlined
			severity="contrast"
			@click="root.previousPage()"
		>
			<IconSVG name="mdiArrowLeft" />
			<span>{{ t('odk_web_forms.back.label') }}</span>
		</Button>
	</div>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.form-footer {
	margin-top: var(--odk-spacing-xl);

	.align-right {
		margin-left: auto;
	}

	.back-button {
		order: -1;
	}

	:deep(.p-button.p-button-contrast.p-button-outlined:not(:hover)) {
		background: var(--odk-base-background-color);
	}

	@media screen and (max-width: #{pf.$lg - 1}) {
		order: 4;
		padding: 0 var(--odk-spacing-xl);
	}
}
</style>
