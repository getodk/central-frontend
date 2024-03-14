<template>
	<div class="odk-form">
		<div class="form-wrapper">
			<FormMenuBar />
			<OdkFormHeader title="Health Survey" />
			
			<OdkPanel :level="0">
				<div class="flex flex-column gap-2">
					<label for="username">1. What's your first name? <span>*</span></label>
					<InputText id="username" aria-describedby="username-help" variant="filled" />
				</div>

				<div class="flex flex-column gap-2">
					<label for="username">2. What's your last name? <span>*</span></label>
					<InputText id="username" aria-describedby="username-help" variant="filled" />
				</div>
			</OdkPanel>

			<OdkPanel :level="0" title="Background">
				<div class="flex flex-column gap-3">
					<label for="username">1. Which country are you currently residing in? <span>*</span></label>
					<Dropdown v-model="selectedCountry" :options="countries" option-label="name" placeholder="Select country" class="w-20rem" />
				</div>
			</OdkPanel>
			
			<OdkPanel :level="0" title="Repeats">
				<OdkPanel :level="1" title="Date 1" :more="true">
					<div class="flex flex-column gap-2">
						<label for="username">1. Enter the date?</label>
						<div>
							<Calendar v-model="someDate" show-icon icon-display="input" />
						</div>
					</div>
					<OdkPanel :level="2" title="Nested repeat" :more="true">
						<div class="flex flex-column gap-2">
							<label for="username">1. Enter the date?</label>
							<div>
								<Calendar v-model="someDate" show-icon icon-display="input" />
							</div>
						</div>
					</OdkPanel>
				</OdkPanel>
				<OdkPanel :level="1" title="Date 2" :more="true">
					<div class="flex flex-column gap-2">
						<label for="username">1. Enter the date?</label>
						<div>
							<Calendar v-model="someDate" show-icon icon-display="input" />
						</div>
					</div>
				</OdkPanel>
			</OdkPanel>

			<div class="footer flex justify-content-end flex-wrap gap-3">
				<Button label="Save as draft" severity="secondary" rounded raised />
				<Button label="Send" rounded raised />
			</div>
		</div>		
	</div>	
</template>

<script setup lang="ts">
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { ref } from 'vue';
import OdkFormHeader from './OdkFormHeader.vue';
import FormMenuBar from './OdkMenuBar.vue';
import OdkPanel from './OdkPanel.vue';

defineProps<{ xform: string }>();

const selectedCountry = ref('');
const countries = [
	{ name: 'Canada', code: 'ca' },
	{ name: 'Pakistan', code: 'pk' },
	{ name: 'US', code: 'us' }
]

const someDate = ref('');
</script>