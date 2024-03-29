<template>
  <OdkPanel :title="label">
    <OdkQuestionList :questions="question.currentState.children" />
  </OdkPanel>
</template>

<script setup lang="ts">
import type { GroupNode } from '@odk-web-forms/xforms-engine';
import { computed } from 'vue';
import OdkPanel from './OdkPanel.vue';
import OdkQuestionList from './OdkQuestionList.vue';


const props = defineProps<{ question: GroupNode }>();

const label = computed( () => 
    props.question.currentState.label?.asString ||
    props.question.definition.bodyElement?.label?.children[0]?.stringValue ||
		''
);

</script>

<style scoped>

</style>