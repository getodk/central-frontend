<template>
	<div class="odk-form">
		<div class="form-wrapper">
			<FormMenuBar />
			<Card class="form-title">
				<template #content>
					<h1>Health Survey</h1>
				</template>
			</Card>
			
			<!-- use card for no title and no collapsing -->
			<Card>
				<template #content>
					<div class="flex flex-column gap-5">
						<div class="flex flex-column gap-2">
							<label for="username">1. What's your first name? <span>*</span></label>
							<InputText id="username" aria-describedby="username-help" variant="filled" />
						</div>

						<div class="flex flex-column gap-2">
							<label for="username">2. What's your last name? <span>*</span></label>
							<InputText id="username" aria-describedby="username-help" variant="filled" />
						</div>
					</div>
				</template>
			</Card>

			<!-- use panel for groups/repeats with title -->
			<Panel header="Header" toggleable :collapsed="panelState" :pt="panelPt">
				<template #header>
					<div class="group-title" role="button" @click="toggle()">
						<h2 class="inline">
							<span :class="panelState ? 'icon-keyboard_arrow_down' : 'icon-keyboard_arrow_up'" /> Background
						</h2>
					</div>
				</template>
				<template #default>
					<div class="flex flex-column gap-5 group-content">
						<div class="flex flex-column gap-3">
							<label for="username">1. Which country are you currently residing in? <span>*</span></label>
							<Dropdown v-model="selectedCountry" :options="countries" option-label="name" placeholder="Select country" class="w-20rem" />
						</div>
					</div>
				</template>
			</Panel>

			<Panel header="Header" toggleable :collapsed="panelState2" :pt="panelPt">
				<template #header>
					<div class="group-title" role="button" @click="toggle2()">
						<h2 class="inline">
							<span :class="panelState ? 'icon-keyboard_arrow_down' : 'icon-keyboard_arrow_up'" /> Repeats
						</h2>
					</div>
				</template>
				<template #default>
					<div class="flex flex-column gap-5 group-content">
						<OdkGroup :level="1" title="Date 1" />
						<OdkGroup :level="0" title="Date 2" />
					</div>
				</template>
			</Panel>

			<div class="footer flex justify-content-end flex-wrap gap-3">
				<Button label="Save as draft" severity="secondary" rounded raised />
				<Button label="Send" rounded raised />
			</div>
		</div>		
	</div>	
</template>

<script setup lang="ts">
import {ref} from 'vue';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext'
import Panel from 'primevue/panel';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Menu from 'primevue/menu';
import FormMenuBar from './FormMenuBar.vue';
import OdkGroup from './OdkGroup.vue';
defineProps<{ xform: string }>();

const panelState = ref(false);
const toggle = () => {
	panelState.value = !panelState.value;
}
const panelPt = {
		toggler: {
			style: 'display:none;'
		}
};

const panelState2 = ref(false);
const toggle2 = () => {
	panelState2.value = !panelState2.value;
}

const selectedCountry = ref('');
const countries = [
	{ name: 'Canada', code: 'ca' },
	{ name: 'Pakistan', code: 'pk' },
	{ name: 'US', code: 'us' }
]
</script>

<style lang="scss" scoped>
.odk-form {
	width: 100%;

	.form-wrapper {
		max-width: 800px;
		margin: 10px auto;

		.form-title{
			border-top: none;

			:deep(.p-card-content){
				padding: 0 10px;

				h1 {
					margin: 10px 0;
				}
			}
		}

		label span {
			color: var(--red-500); // TODO maybe theme should export color of danger / error
		}

		.footer {
			margin-top: 20px;

			button{
				min-width: 160px;
			}
		}
	}
}
.p-card {
	margin-top: 20px;
	padding: 10px 15px;
}

.p-panel {
	margin-top: 20px;
	padding: 10px 15px;
}

.group-title {
	margin-top: 10px;
	margin-bottom: 10px;
	cursor: pointer;
}

.group-content {
	padding-top: 10px;
}

</style>
