<script setup lang="ts">
import type { GeneralChildNode, GroupNode, RepeatInstanceNode } from '@getodk/xforms-engine';
import { type MenuItem } from 'primevue/menuitem';
import { computed } from 'vue';
import FormPanel from './FormPanel.vue';
import QuestionList from './QuestionList.vue';

const props = defineProps<{ instance: RepeatInstanceNode; instanceIndex: number }>();

const isGroup = (child: GeneralChildNode | undefined) => {
	return child?.definition.bodyElement?.type === 'group';
};

const label = computed(() => {
	// It has just one child and that is a group with label
	// then we use label of that group
	const childLabel =
		props.instance.currentState.children.length === 1 &&
		isGroup(props.instance.currentState.children[0]) &&
		props.instance.currentState.children[0]?.currentState.label;
	if (childLabel) {
		return { formatted: childLabel.formatted };
	}

	// Use parent (repeat range) label if it's there
	const parentLabel = props.instance.currentState.label;
	if (parentLabel) {
		return { formatted: parentLabel.formatted };
	}

	// TODO: translations
	return { literal: `Repeat Item` };
});

const children = computed(() => {
	// It has just one child and that is a group
	// then we use its children - essentially coalesce RepeatInstance and Group into one.
	if (
		props.instance.currentState.children.length === 1 &&
		isGroup(props.instance.currentState.children[0])
	) {
		return (props.instance.currentState.children[0] as GroupNode).currentState.children;
	}

	return props.instance.currentState.children;
});

const menuItems = computed((): MenuItem[] | undefined => {
	const { parent } = props.instance;

	if (parent.nodeType === 'repeat-range:controlled') {
		return;
	}

	return [
		{
			/* TODO: translations */
			label: 'Remove',
			icon: 'icon-delete',
			command: () => {
				return parent.removeInstances(props.instanceIndex);
			},
		},
	];
});
</script>
<template>
	<FormPanel :title="label.literal" :title-formatted="label.formatted" :menu-items="menuItems" :label-number="instanceIndex + 1" :is-repeat="true">
		<QuestionList :nodes="children" />
	</FormPanel>
</template>

