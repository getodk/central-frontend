<template>
  <OdkPanel :title="label" :more="true" @remove="$emit('remove')">
    <OdkQuestionList :questions="children" />
  </OdkPanel>
</template>

<script setup lang="ts">
import type { GroupNode, RepeatInstanceNode } from '@odk-web-forms/xforms-engine';
import { computed } from 'vue';
import OdkPanel from './OdkPanel.vue';
import OdkQuestionList from './OdkQuestionList.vue';

const props = defineProps<{ instance: RepeatInstanceNode, instanceIndex: number }>();

defineEmits(['remove']);

const label = computed(() => {
  if(props.instance.currentState.children.length === 1 && props.instance.currentState.children[0].definition.bodyElement?.type === 'logical-group'){
		if(props.instance.currentState.children[0].currentState.label?.asString || props.instance.currentState.children[0].definition.bodyElement.label?.children[0]?.stringValue){
			return (props.instance.currentState.children[0].currentState.label?.asString || props.instance.currentState.children[0].definition.bodyElement.label?.children[0]?.stringValue) as string;
		}
	}

  if(props.instance.parent.definition.bodyElement.label?.children[0]?.stringValue){
		return `${props.instance.parent.definition.bodyElement.label?.children[0].stringValue} ${props.instanceIndex + 1}`;
	}
  else{
    return `Repeats ${props.instanceIndex+1}`;
  }
});

const children = computed(() => {
  if(props.instance.currentState.children.length === 1 && props.instance.currentState.children[0].definition.bodyElement?.type === 'logical-group'){
		return (props.instance.currentState.children[0] as GroupNode).currentState.children;
	}
	else{
		return props.instance.currentState.children;
	}
});

</script>

<style scoped>

</style>