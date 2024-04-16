<script setup lang="ts">
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import { ref } from 'vue';

const languages = [
	{ name: 'English', code: 'en' },
	{ name: 'French', code: 'fr' },
]
const selectedLanguage = ref(languages[0]);

</script>
<template>
	<div class="odk-menu-bar flex justify-content-end flex-wrap gap-3">
		<Button severity="secondary" rounded icon="icon-local_printshop" />
		<Dropdown v-model="selectedLanguage" class="flex align-items-center rounded with-icon" :options="languages" option-label="name" placeholder="Select the language">
			<template #value="slotProps">				
				<span class="icon-language" />
				<span>
					{{ slotProps.value.name }}
				</span>
			</template>
			<template #option="slotProps">
				<span class="dd-label">{{ slotProps.option.name }}</span>
			</template>
		</Dropdown>
	</div>
</template>

