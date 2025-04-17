<script setup lang="ts">
import type { ActiveLanguage, FormLanguage } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import RadioButton from 'primevue/radiobutton';
import { ref } from 'vue';

const props = defineProps<{
	state: boolean;
	languages: FormLanguage[];
	activeLanguage: ActiveLanguage;
}>();
const emit = defineEmits(['update:state', 'update:activeLanguage']);

const selectedLanguage = ref<ActiveLanguage>(props.activeLanguage);

const handleSave = () => {
	emit('update:activeLanguage', selectedLanguage.value);
	emit('update:state', false);
};

const handleCancel = () => {
	selectedLanguage.value = props.activeLanguage;
	emit('update:state', false);
};
</script>

<template>
	<Dialog :visible="state" modal header="Change language" class="language-dialog" :closable="false" @update:visible="handleCancel()">
		<label
			v-for="lang in languages"
			:key="lang.language"
			:for="lang.language"
			class="lang-options"
		>
			<RadioButton
				v-model="selectedLanguage"
				:input-id="lang.language"
				:name="lang.language"
				:value="lang"
			/>
			{{ lang.language }}
		</label>

		<div class="flex justify-content-end mt-5">
			<Button label="Cancel" text @click="handleCancel()" />
			<Button label="Save" class="ml-2" @click="handleSave()" />
		</div>
	</Dialog>
</template>

<style scoped lang="scss">
.lang-options {
	width: 100%;
	display: block;
	border: 1px solid var(--odk-border-color);
	padding: 10px 0 10px 8px;
	border-radius: var(--odk-radius);
	margin-bottom: 10px;
	cursor: pointer;

	&:hover {
		border-color: var(--odk-primary-border-color);
	}
	> div {
		margin-right: 10px;
	}
}

button {
	min-width: 100px;
}
</style>

<style lang="scss">
.p-dialog.language-dialog {
	min-width: 300px;
	border-radius: var(--odk-radius);

	.p-dialog-header {
		border-top-right-radius: var(--odk-radius);
		border-top-left-radius: var(--odk-radius);
	}

	.p-dialog-content:last-of-type {
		border-bottom-right-radius: var(--odk-radius);
		border-bottom-left-radius: var(--odk-radius);
	}
}
</style>
