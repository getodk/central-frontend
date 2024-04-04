<template>
	<Panel v-if="!noUi" :class="panelClass" :toggleable="true" :collapsed="panelState">
		<template #header>
			<div class="panel-title" role="button" @click="toggle">
				<h2 class="inline">					
					<span :class="panelState ? 'icon-keyboard_arrow_down' : 'icon-keyboard_arrow_up'" /> {{ title }}
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

<script setup lang="ts">
import Button from 'primevue/button';
import Menu, { type MenuState } from 'primevue/menu';
import { type MenuItem } from 'primevue/menuitem';
import Panel from 'primevue/panel';
import { computed, ref } from 'vue';

const props = withDefaults(defineProps<{title?: string, menuItems?: MenuItem[], noUi?: boolean}>(), {
	title: undefined,
	menuItems: undefined,
	noUi: false
});

const panelClass = computed(() => [
  'with-title',
  props.menuItems && props.menuItems.length > 0 ? 'with-context-menu' : 'no-context-menue',
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