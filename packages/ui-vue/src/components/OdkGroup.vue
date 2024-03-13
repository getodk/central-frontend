<template>
	<Panel class="nested" header="Header" toggleable :collapsed="panelState" :pt="panelPt">
		<template #header>
			<div class="group-title" role="button" @click="toggle()">
				<h2 class="inline">
					<span :class="panelState ? 'icon-keyboard_arrow_down' : 'icon-keyboard_arrow_up'" /> {{ title }}
				</h2>
			</div>
		</template>
		<template #default>
			<div class="flex flex-column gap-5">
				<div class="flex flex-column gap-2">
					<label for="username">1. Enter the date?</label>
					<div>
						<Calendar v-model="someDate" show-icon icon-display="input" />
					</div>
				</div>

				<OdkGroup v-if="level == 1" :level="2" title="Nested repeat" />
			</div>
		</template>
		<template #icons>
			<Button severity="secondary" rounded class="btn-context" :class="{ 'p-focus': menu?.overlayVisible }" icon="icon-more_vert" aria-label="Submit" @click="toggleMenu" />
			<Menu ref="menu" :model="items" :popup="true" />
		</template>
	</Panel>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import Panel from 'primevue/panel';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Calendar from 'primevue/calendar';
import type MenuItem from 'primevue';

defineProps<{ level: number, title: string }>();

const panelState = ref(false);
const toggle = () => {
	panelState.value = !panelState.value;
}
const panelPt = {
		toggler: {
			style: 'display:none;'
		}
};

const menu = ref<Menu>();

const toggleMenu = (event:  Event) => {
    menu.value.toggle(event);
};

const items: MenuItem[] = [
	{label: 'Remove', icon: 'icon-delete'}
];

const someDate = ref('');
</script>

<style lang="scss" scoped>

/* TODO add prop for tree level and style > 0 level as left border */
.p-panel.nested {
	border: none;
	box-shadow: none;
	border-radius: 0;
	border-left: 5px solid var(--primary-50);
	padding-top: 0;
	padding-bottom: 0;
	padding-left: 15px;

	:deep(.p-panel-header){
		padding-top: 0;
		padding-left: 0;
	}

	:deep(.p-panel-content){
		padding-right: 0;
		padding-bottom: 0;
	}

	.group-title{
		cursor: pointer;
	}

	.btn-context {
		height: 2rem;
		width: 2rem;
	}
}


</style>