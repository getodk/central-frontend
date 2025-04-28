<script setup lang="ts">
import IconSVG from '@/components/widgets/IconSVG.vue';
import Button from 'primevue/button';
import Menu, { type MenuState } from 'primevue/menu';
import { type MenuItem } from 'primevue/menuitem';
import Panel from 'primevue/panel';
import { computed, ref } from 'vue';

export interface PanelProps {
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
	labelNumber: undefined,
});

const panelClass = computed(() => [
	props.menuItems && props.menuItems.length > 0 ? 'with-context-menu' : 'no-context-menu',
	props.class,
]);

const panelState = ref(false);

const toggle = () => {
	panelState.value = !panelState.value;
};

const menu = ref<InstanceType<typeof Menu> & MenuState>();

const toggleMenu = (event: Event) => {
	menu.value?.toggle(event);
};
</script>
<template>
	<Panel v-if="!noUi" :class="panelClass" :toggleable="true" :collapsed="panelState">
		<template #header>
			<div class="panel-title" role="button" @click="toggle">
				<h2>
					<IconSVG v-if="panelState" name="mdiChevronDown" />
					<IconSVG v-if="!panelState" name="mdiChevronUp" />
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
	font-size: var(--odk-group-font-size);
	font-weight: 400;
	margin: 0;
	display: flex;
	align-items: center;
}

.label-number {
	display: inline-block;
	margin: 0 5px 0 17px;
	width: 20px;
	height: 20px;
	font-weight: 500;
	border-radius: var(--odk-radius);
	background-color: var(--odk-muted-background-color);
	font-size: var(--odk-base-font-size);
	text-align: center;
}

.panel-title {
	cursor: pointer;
}

.btn-context {
	margin-top: -10px;

	&.p-button.p-button-secondary:not(:disabled) {
		&:active,
		&:focus,
		&.p-focus {
			background: var(--odk-primary-lighter-background-color);
		}

		&:hover {
			background: var(--odk-primary-light-background-color);
		}
	}

	:deep(.p-button-icon) {
		font-size: 1.5rem;
	}
}

.p-panel.p-panel-toggleable {
	background: var(--odk-base-background-color);
	border: none;
	box-shadow: none;

	.p-panel {
		margin-left: -10px;
	}

	:deep(.p-panel-header) {
		display: flex;
		padding: 15px 0;
		align-items: start;

		.p-panel-header-actions {
			display: none;
		}
	}

	:deep(.p-panel-content) {
		border-left: 1px solid var(--odk-border-color);
		margin-left: 10px;
		border-radius: 0;
		padding: 0 0 0 1.5rem;
	}

	:deep(.p-panel-toggler) {
		display: none;
	}
}

.content-wrapper {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}
</style>
