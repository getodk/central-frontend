<script setup lang="ts">
import Button from 'primevue/button';
import Menu, { type MenuState } from 'primevue/menu';
import { type MenuItem } from 'primevue/menuitem';
import Panel from 'primevue/panel';
import { computed, ref } from 'vue';

interface PanelProps {
	title?: string;
	menuItems?: MenuItem[];
	noUi?: boolean;
	class?: string[] | string;
	labelIcon?: string;
	labelNumber?: number;
}

const props = withDefaults(defineProps<PanelProps>(), {
	title: undefined,
	menuItems: undefined,
	noUi: false,
	class: undefined,
	labelIcon: undefined,
	labelNumber: undefined
});

const panelClass = computed(() => [
	props.menuItems && props.menuItems.length > 0 ? 'with-context-menu' : 'no-context-menu',
	props.class
]);

const panelState = ref(false);

const toggle = () => {
	panelState.value = !panelState.value;
}

const menu = ref<Menu & MenuState>();

const toggleMenu = (event:  Event) => {
	menu.value?.toggle(event);
};

</script>
<template>
	<Panel v-if="!noUi" :class="panelClass" :toggleable="true" :collapsed="panelState">
		<template #header>
			<div class="panel-title" role="button" @click="toggle">
				<h2>
					<span :class="panelState ? 'icon-keyboard_arrow_down' : 'icon-keyboard_arrow_up'" /> 
					<span v-if="labelNumber" class="label-number">{{ labelNumber }}</span>
					<span>{{ title }}</span>
					<span v-if="labelIcon" class="ml-2" :class="labelIcon" />
				</h2>
			</div>
		</template>
		<template v-if="menuItems && menuItems.length > 0" #icons>
			<Button severity="secondary" rounded class="btn-context" :class="{ 'p-focus': menu?.overlayVisible }" icon="icon-more_vert" aria-label="More" @click="toggleMenu" />
			<Menu ref="menu" :model="menuItems" :popup="true" />
		</template>
		<template #default>
			<div class="content-wrapper">
				<slot />
			</div>
		</template>
	</Panel>
	<template v-else>
		<slot />
	</template>
</template>

<style scoped lang="scss">
h2 {
	font-size: 1.2rem;
	font-weight: 500;
	margin: 0;
	display: flex;
}

.label-number {
	display: inline-block;
	margin: 2px 5px 0 17px;
	padding-top: 4px;
	width: 20px;
	height: 20px;
	font-weight: 400;
	border-radius: 30px;
	background-color: var(--gray-200);
	font-size: 10px;
	text-align: center;
}

.panel-title {
	cursor: pointer;
}

.btn-context {
	margin-top: -10px;

	.p-button-icon {
		font-size: 1.5rem;
	}
}

.p-panel.p-panel-toggleable {	
	background: var(--surface-0);
	box-shadow: none;

	.p-panel {
		margin-left: -10px;
	}

	:deep(.p-panel-header) {
		display: flex;
		padding: 0;
		height: 40px;
		align-items: start;
	}

	:deep(.p-panel-content) {
		border-left: 2px solid var(--gray-200);
		margin-left: 10px;
		border-radius: 0;
		padding: 0 0 0 1.5rem;
	}

	:deep(.p-panel-toggler){
		display: none;
	}
	
}

.content-wrapper {
	display: flex;
	flex-direction: column;
	gap: 2rem;
}
</style>