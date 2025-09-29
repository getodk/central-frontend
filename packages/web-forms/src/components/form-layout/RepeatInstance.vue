<script setup lang="ts">
import type { GeneralChildNode, GroupNode, RepeatInstanceNode } from '@getodk/xforms-engine';
import { type MenuItem } from 'primevue/menuitem';
import { computed } from 'vue';
import FormPanel from './FormPanel.vue';
import QuestionList from './QuestionList.vue';

const props = defineProps<{ instance: RepeatInstanceNode; instanceIndex: number }>();

const isGroup = (child: GeneralChildNode) => {
	return child.definition.bodyElement?.type === 'group';
};

const label = computed(() => {
	// It has just one child and that is a group with label
	// then we use label of that group
	if (
		props.instance.currentState.children.length === 1 &&
		isGroup(props.instance.currentState.children[0]) &&
		props.instance.currentState.children[0].currentState.label
	) {
		return props.instance.currentState.children[0].currentState.label?.asString;
	}

	// Use parent (repeat range) label if it's there
	// TODO/sk: use state.label.asString
	if (props.instance.parent.definition.bodyElement.label?.chunks[0]?.stringValue) {
		return `${props.instance.parent.definition.bodyElement.label?.chunks[0].stringValue}`;
	}

	// TODO: translations
	return `Repeat Item`;
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
	<FormPanel :title="label" :menu-items="menuItems" :label-number="instanceIndex + 1" :is-repeat="true">
		<QuestionList :nodes="children" />
	</FormPanel>
</template>

