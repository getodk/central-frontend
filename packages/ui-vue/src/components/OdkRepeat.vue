<template>
	<OdkPanel :title="label" :no-ui="!label" class="repeat">
		<OdkRepeatInstance v-for="(instance, index) in question.currentState.children" :key="index" :instance="instance" :instance-index="index" @remove="question.removeInstances(index)" />
    
		<div class="flex justify-content-start flex-wrap">
			<Button label="Add" rounded outlined class="w-2" @click="question.addInstances()" />
		</div>
	</OdkPanel>
</template>

<script setup lang="ts">
import type { RepeatRangeNode } from '@odk-web-forms/xforms-engine';
import Button from 'primevue/button';
import { computed } from 'vue';
import OdkPanel from './OdkPanel.vue';
import OdkRepeatInstance from './OdkRepeatInstance.vue';

const props = defineProps<{ question: RepeatRangeNode}>();

const label = computed(() => props.question.currentState.label?.asString);

</script>

<style scoped>

</style>