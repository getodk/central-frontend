<script setup lang="ts">
import IconSVG from '@getodk/web-forms/components/common/IconSVG.vue';
import { TRANSLATE } from '@getodk/web-forms/lib/constants/injection-keys.ts';
import type { Translate } from '@getodk/web-forms/lib/locale/useLocale.ts';
import Dialog from 'primevue/dialog';
import { inject, ref } from 'vue';

const GOOGLE_PRIVACY_POLICY_URL = 'https://policies.google.com/privacy';

const t: Translate = inject(TRANSLATE)!;
const isDialogOpen = ref(false);
</script>

<template>
	<div class="map-privacy-badge">
		<button
			:aria-label="t('map_privacy_dialog.open.description')"
			class="open-privacy-dialog"
			@click="isDialogOpen = true"
		>
			<IconSVG name="mdiInformationSlabCircleOutline" size="sm" variant="muted" />
		</button>
	</div>

	<Dialog v-model:visible="isDialogOpen" modal class="map-block-dialog" :draggable="false">
		<template #header>
			<strong>{{ t('map_privacy_dialog.header.title') }}</strong>
		</template>

		<template #default>
			<p>{{ t('map_privacy_dialog.body.text') }}</p>
			<p>
				<a :href="GOOGLE_PRIVACY_POLICY_URL" target="_blank">{{ t('map_privacy_dialog.privacy_policy.link') }}</a>
			</p>
		</template>
	</Dialog>
</template>

<style scoped lang="scss">
.map-privacy-badge {
	position: absolute;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	width: var(--odk-map-privacy-badge-size);
	height: var(--odk-map-privacy-badge-size);
	background: rgba(245, 245, 245, 0.8);
	z-index: var(--odk-z-index-form-content);

	.open-privacy-dialog {
		display: flex;
		align-items: center;
		justify-content: center;
		height: var(--odk-icon-m);
		width: var(--odk-icon-m);
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
	}
}
</style>
