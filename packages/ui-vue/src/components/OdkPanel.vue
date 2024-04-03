<template>
	<Panel v-if="!!title" :class="panelClass" :toggleable="!!title" :collapsed="panelState">
		<template #header>
			<div class="panel-title" role="button" @click="toggle">
				<h2 class="inline">					
					<span :class="panelState ? 'icon-keyboard_arrow_down' : 'icon-keyboard_arrow_up'" /> {{ title }}
				</h2>
			</div>
		</template>
		<template v-if="more" #icons>
			<Button severity="secondary" rounded class="btn-context" :class="{ 'p-focus': menu?.overlayVisible }" icon="icon-more_vert" aria-label="Submit" @click="toggleMenu" />
			<Menu ref="menu" :model="items" :popup="true" />
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

<script setup lang="ts">
import Button from 'primevue/button';
import Menu, { type MenuState } from 'primevue/menu';
import { type MenuItem } from 'primevue/menuitem';
import Panel from 'primevue/panel';
import { ref } from 'vue';

const props = defineProps<{title?: string, more?: boolean}>();

const emit = defineEmits(['remove']);

const panelClass = [
  props.title ? 'with-title' : 'no-title',
  props.more ? 'with-context-menu' : 'no-context-menue',
];

const panelState = ref(false);

const toggle = () => {
	panelState.value = !panelState.value;
}

const menu = ref<Menu & MenuState>();

const toggleMenu = (event:  Event) => {
    menu.value?.toggle(event);
};

const items: MenuItem[] = [
	{label: 'Remove', icon: 'icon-delete', command: () => emit("remove")}
];
</script>