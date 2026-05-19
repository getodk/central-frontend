<script setup lang="ts">
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { inject } from 'vue';

defineProps<{
	visible: boolean;
}>();

const t: Translate = inject(TRANSLATE)!;
const emit = defineEmits(['update:visible', 'deleteFile']);
</script>

<template>
	<Dialog
		:visible="visible"
		modal
		:draggable="false"
		@update:visible="emit('update:visible', $event)"
	>
		<template #header>
			<strong>{{ t('upload_delete_dialog.header.title') }}</strong>
		</template>

		<template #default>
			<p>{{ t('upload_delete_dialog.body.message') }}</p>
		</template>

		<template #footer>
			<Button :label="t('odk_web_forms.delete.label')" @click="emit('deleteFile')" />
		</template>
	</Dialog>
</template>
