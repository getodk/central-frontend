<script setup lang="ts">
import type { RepeatRangeNode } from '@odk-web-forms/xforms-engine';
import Button from 'primevue/button';
import { computed } from 'vue';
import FormPanel from './FormPanel.vue';
import RepeatInstance from './RepeatInstance.vue';

const props = defineProps<{ question: RepeatRangeNode}>();

const label = computed(() => props.question.currentState.label?.asString);

</script>
<template>
	<FormPanel :title="label" :no-ui="!label" class="repeat">
		<RepeatInstance v-for="(instance, index) in question.currentState.children" :key="index" :instance="instance" :instance-index="index" @remove="question.removeInstances(index)" />
    
		<div class="flex justify-content-start flex-wrap">
			<Button label="Add" rounded outlined class="w-2" @click="question.addInstances()" />
		</div>
	</FormPanel>
</template>

