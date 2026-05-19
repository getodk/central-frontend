<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import type { UploadNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import type { HTMLInputElementEvent, Ref } from 'vue';
import { inject, ref, watchEffect } from 'vue';

const t: Translate = inject(TRANSLATE)!;

const selectAudioInput = ref<HTMLInputElement | null>(null);

export interface UploadVideoHeaderProps {
	readonly question: UploadNode;
	readonly isDisabled: boolean;
	readonly accept: string;
}

const props = defineProps<UploadVideoHeaderProps>();

const triggerInputField = (inputField: HTMLInputElement | null) => {
	if (inputField == null) {
		return;
	}

	inputField.click();
};

const clearInputRefValue = (inputRef: Ref<HTMLInputElement | null>) => {
	if (inputRef.value != null) {
		inputRef.value.value = '';
	}
};

const onChange = (event: HTMLInputElementEvent) => {
	emit('change', event.target.files?.[0] ?? null);
};

watchEffect(() => {
	if (props.question.currentState.value == null) {
		clearInputRefValue(selectAudioInput);
	}
});

const emit = defineEmits(['change']);
</script>

<template>
	<Button
		:disabled="isDisabled"
		@click="triggerInputField(selectAudioInput)"
	>
		<IconSVG name="mdiFileMusic" variant="inverted" />
		<span>{{ t('upload_control.choose_file.label') }}</span>
	</Button>
	<input
		ref="selectAudioInput"
		type="file"
		:accept="accept"
		style="display: none"
		@change="onChange"
	>
</template>
