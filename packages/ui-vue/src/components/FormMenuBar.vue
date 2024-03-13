<template>
	<div class="flex justify-content-end flex-wrap gap-3">
		<Button severity="secondary" rounded icon="icon-local_printshop" class="print" />
		<Dropdown v-model="selectedLanguage" class="flex align-items-center" :options="languages" option-label="name" placeholder="Select the language">
			<template #value="slotProps">
				<span class="icon-language" />
				<span class="dd-label">{{ slotProps.value.name }}</span>
			</template>
			<template #option="slotProps">
				<span class="dd-label">{{ slotProps.option.name }}</span>
			</template>
		</Dropdown>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';

const languages = [
	{ name: 'English', code: 'en' },
	{ name: 'French', code: 'fr' },
]
const selectedLanguage = ref(languages[0]);

</script>

<style lang="scss" scoped>
	.print {
		height: 2rem;
		width: 2rem;
	}
	.p-dropdown {
		border-radius: 30px;
		border: none;
		width: 160px;

		&.p-focus {
			box-shadow: inset 0 0 0 1px var(--primary-500);
		}

		:deep(.p-dropdown-label) {
			padding: 5px 16px;

			span {
				vertical-align: middle;
			}
		}
	}

	.p-dropdown, .p-dropdown-panel {
		.icon-language{
			font-size: 22px;
		}
		.dd-label {
			margin-left: 10px;
		}
	}
</style>