<script setup lang="ts">
import type { ActiveLanguage, FormLanguage } from '@getodk/xforms-engine';
import PrimeButton from 'primevue/button';
import PrimeDialog from 'primevue/dialog';
import PrimeRadioButton from 'primevue/radiobutton';
import { ref } from 'vue';

const props = defineProps<{ state: boolean, languages: FormLanguage[], activeLanguage: ActiveLanguage }>();
const emit = defineEmits(['update:state', 'update:activeLanguage']);


const selectedLanguage = ref<ActiveLanguage>(props.activeLanguage);

const handleSave = () => {
	emit('update:activeLanguage', selectedLanguage.value);
	emit('update:state',false);
};

const handleCancel = () => {
	selectedLanguage.value = props.activeLanguage;
	emit('update:state',false);
}

</script>

<template>
	<PrimeDialog :visible="state" modal header="Change language" class="language-dialog" :closable="false" @update:visible="handleCancel()">
		<label 
			v-for="lang in languages" 
			:key="lang.language" 
			:for="lang.language" 
			class="lang-options"
		>
			<PrimeRadioButton
				v-model="selectedLanguage"
				:input-id="lang.language"
				:name="lang.language"
				:value="lang"
			/>
			{{ lang.language }}</label>

		<div class="flex justify-content-end mt-5">
			<PrimeButton label="Cancel" rounded text @click="handleCancel()" />
			<PrimeButton label="Save" rounded raised @click="handleSave()" />
		</div>
	</PrimeDialog>
</template>

<style scoped lang="scss">


.lang-options {
		width: 100%;
    display: block;
		border: 1px solid #E6E1E5;
    padding: 10px 0 10px 8px;
    border-radius: 10px;
    margin-bottom: 10px;
    cursor: pointer;

		&:hover {
			border-color: var(--primary-500);
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
	--radius: 20px;

	min-width: 300px;
	border-radius: var(--radius);

	.p-dialog-header {
		border-top-right-radius: var(--radius);
		border-top-left-radius: var(--radius);
	}

	.p-dialog-content:last-of-type {
		border-bottom-right-radius: var(--radius);
    border-bottom-left-radius: var(--radius);
	}
}
</style>