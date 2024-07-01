<script setup lang="ts">
import type { GeneralChildNode, GroupNode, RepeatInstanceNode } from '@getodk/xforms-engine';
import { type MenuItem } from 'primevue/menuitem';
import { computed } from 'vue';
import FormPanel from './FormPanel.vue';
import QuestionList from './QuestionList.vue';

const props = defineProps<{ instance: RepeatInstanceNode, instanceIndex: number }>();

const emit = defineEmits(['remove']);

const isGroup = (child: GeneralChildNode) => {
	return (
		child.definition.bodyElement?.type === 'logical-group' ||
		child.definition.bodyElement?.type === 'presentation-group'
	);
}

const label = computed(() => {
	// It has just one child and that is a group with label
	// then we use label of that group
	if( props.instance.currentState.children.length === 1 &&
		isGroup(props.instance.currentState.children[0]) &&
		props.instance.currentState.children[0].currentState.label
	) {
		return props.instance.currentState.children[0].currentState.label?.asString
	}

	// Use RepeatRangeNode label if it's there
	// TODO/sk: use state.label.asString
	if(props.instance.parent.definition.bodyElement.label?.chunks[0]?.stringValue){
		return `${props.instance.parent.definition.bodyElement.label?.chunks[0].stringValue}`;
	}

	return `Repeat Item`;
});

const children = computed(() => {
	// It has just one child and that is a group
	// then we use its children - essentially coalesce RepeatInstance and Group into one.
	if(props.instance.currentState.children.length === 1 && isGroup(props.instance.currentState.children[0])){
		return (props.instance.currentState.children[0] as GroupNode).currentState.children;
	}
	else{
		return props.instance.currentState.children;
	}
});

const menuItems: MenuItem[] = [
	{label: 'Remove', icon: 'icon-delete', command: () => emit("remove")}
];

</script>
<template>
	<FormPanel :title="label" :menu-items="menuItems" class="repeat" :label-number="instanceIndex + 1">
		<QuestionList :nodes="children" />
	</FormPanel>
</template>

