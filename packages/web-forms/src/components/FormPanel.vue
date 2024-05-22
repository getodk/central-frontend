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
	class?: string;
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
	'with-title',
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
			<div class="flex flex-column gap-5">
				<slot />
			</div>
		</template>
	</Panel>
	<template v-else>
		<slot />
	</template>
</template>

