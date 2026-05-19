<script setup lang="ts">
import {
	SINGLE_FEATURE_TYPES,
	type SingleFeatureType,
} from '@/components/common/map/getModeConfig.ts';
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { inject } from 'vue';

defineProps<{
	singleFeatureType: SingleFeatureType | undefined;
	visible: boolean;
}>();

const emit = defineEmits(['update:visible', 'deleteFeature']);

const t: Translate = inject(TRANSLATE)!;
</script>

<template>
	<Dialog
		:visible="visible"
		modal
		class="map-block-dialog"
		:draggable="false"
		@update:visible="emit('update:visible', $event)"
	>
		<template #header>
			<strong v-if="singleFeatureType === SINGLE_FEATURE_TYPES.SHAPE">{{ t('map_confirm_dialog.delete_shape.header') }}</strong>
			<strong v-else>{{ t('map_confirm_dialog.delete_trace.header') }}</strong>
		</template>

		<template #default>
			<p v-if="singleFeatureType === SINGLE_FEATURE_TYPES.SHAPE">
				{{ t('map_confirm_dialog.delete_shape.body') }}
			</p>
			<p v-else>
				{{ t('map_confirm_dialog.delete_trace.body') }}
			</p>
		</template>

		<template #footer>
			<Button :label="t('odk_web_forms.delete.label')" @click="emit('deleteFeature')" />
		</template>
	</Dialog>
</template>
