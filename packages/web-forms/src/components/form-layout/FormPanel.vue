<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import MarkdownBlock from '@/components/common/MarkdownBlock.vue';
import type { MarkdownNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import Menu, { type MenuState } from 'primevue/menu';
import { type MenuItem } from 'primevue/menuitem';
import Panel from 'primevue/panel';
import { ref } from 'vue';

export interface PanelProps {
	title?: string;
	titleFormatted?: MarkdownNode[];
	labelNumber?: number;
	menuItems?: MenuItem[];
	noUi?: boolean;
	isRepeat?: boolean;
}

const props = withDefaults(defineProps<PanelProps>(), {
	title: undefined,
	titleFormatted: undefined,
	labelNumber: undefined,
	menuItems: undefined,
	noUi: false,
	isRepeat: false,
});

const panelState = ref(false);
const menu = ref<InstanceType<typeof Menu> & MenuState>();
</script>
<template>
	<Panel
		v-if="!noUi"
		:class="{
			'is-repeat': props.isRepeat,
			'with-context-menu': !!props.menuItems?.length,
			'no-context-menu': !props.menuItems?.length,
			'panel-content-hidden': panelState,
		}"
		:toggleable="true"
		:collapsed="panelState"
	>
		<template #header>
			<div class="panel-title" role="button" @click="() => panelState = !panelState">
				<h2>
					<IconSVG v-if="panelState" name="mdiChevronDown" />
					<IconSVG v-if="!panelState" name="mdiChevronUp" />
					<span v-if="titleFormatted">
						<MarkdownBlock v-for="elem in titleFormatted" :key="elem.id" :elem="elem" />
					</span>
					<span v-else>{{ title }}</span>
				</h2>
				<span v-if="labelNumber" class="label-number">{{ labelNumber }}</span>
			</div>
		</template>
		<template v-if="menuItems?.length" #icons>
			<Button variant="text" class="button-menu" @click="(event) => menu?.toggle(event)">
				<IconSVG name="mdiDotsVertical" />
			</Button>
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
@use 'primeflex/core/_variables.scss' as pf;

h2 {
	font-size: var(--odk-top-group-font-size);
	font-weight: 400;
	margin: 0;
	display: flex;
	align-items: center;
	cursor: pointer;
}

.label-number {
	margin-right: 15px;
	padding: 5px 10px;
	border-radius: var(--odk-radius);
	background-color: var(--odk-muted-background-color);
	font-size: var(--odk-hint-font-size);
	font-weight: 400;
	text-align: center;
	height: fit-content;
}

.p-panel.p-panel-toggleable {
	background: var(--odk-base-background-color);
	box-shadow: none;
	border: 1px solid var(--odk-border-color);
	border-radius: var(--odk-radius);

	&:not(:last-child) {
		margin-bottom: 20px;
	}

	:deep(.p-panel-header) {
		display: flex;
		align-items: center;
		background: var(--odk-light-background-color);
		border-radius: var(--odk-radius) var(--odk-radius) 0 0;
		width: 100%;
		padding: 12px 20px;

		.p-panel-toggle-button {
			display: none;
		}

		.panel-title {
			display: flex;
			justify-content: space-between;
			flex-wrap: nowrap;
			flex-basis: 100%;
			align-items: center;
		}

		.panel-title .odk-icon {
			margin-right: 15px;
		}
	}

	:deep(.p-panel-content) {
		border-top: 1px solid var(--odk-border-color);
		padding: 15px 0;
	}

	:deep(.p-panel-toggler) {
		display: none;
	}

	.p-panel.p-panel-toggleable {
		// Nested groups
		border: none;
		margin-bottom: 0;

		:deep(.p-panel-header) {
			background: none;

			h2 {
				font-size: var(--odk-sub-group-font-size);
			}
		}

		:deep(.p-panel-content) {
			border: none;
		}
	}

	&.panel-content-hidden :deep(.p-panel-header) {
		border-radius: var(--odk-radius);
	}
}

.p-panel :deep(.p-panel-header-actions) {
	display: flex;
	align-items: center;
	flex-wrap: wrap;

	.p-button {
		padding: 0;
		min-height: auto;

		&:hover {
			border-color: transparent;
			background: none;
			outline: none;
		}
	}
}

.content-wrapper {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.p-panel.is-repeat {
	.p-panel.p-panel-toggleable.is-repeat :deep(.p-panel-header) {
		// Nested repeats
		border-radius: var(--odk-radius);
		width: calc(100% - 30px);
		margin: 0 auto;
	}

	:deep(.p-panel-header),
	.p-panel.p-panel-toggleable.is-repeat :deep(.p-panel-header) {
		background: var(--p-surface-200);
	}
}

@media screen and (max-width: #{pf.$sm}) {
	.p-panel.p-panel-toggleable {
		border: none;

		:deep(.p-panel-content) {
			border: none;
		}

		&.is-repeat :deep(.p-panel-header) {
			border-radius: var(--odk-radius);
		}
	}
}
</style>

<style lang="scss">
// Overrides Central's styles
.p-menu-list .p-menu-item-link,
.p-menu-list .p-menu-item-link:hover {
	color: var(--odk-text-color);
}
</style>
