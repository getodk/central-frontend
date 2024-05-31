<script setup lang="ts">
import type { RepeatRangeNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import { computed } from 'vue';
import FormPanel from './FormPanel.vue';
import RepeatInstance from './RepeatInstance.vue';

const props = defineProps<{ node: RepeatRangeNode}>();

const label = computed(() => props.node.currentState.label?.asString);

</script>
<template>
	<FormPanel :title="label" :no-ui="!label" class="repeat" label-icon="icon-repeat">
		<RepeatInstance v-for="(instance, index) in node.currentState.children" :key="index" :instance="instance" :instance-index="index" @remove="node.removeInstances(index)" />

		<div class="flex justify-content-start flex-wrap">
			<Button label="Add" rounded outlined class="w-2 btn-add" @click="node.addInstances()" />
		</div>
	</FormPanel>
</template>

<style scoped lang="scss">

.p-button.p-button-outlined.btn-add {
	box-shadow: inset 0 0 0 1px #cbcacc;
	margin-left: 36px;

	&:hover {
		background: var(--primary-100);
	}
}

.repeat {
	.p-button.p-button-outlined.btn-add {
		margin-left: 25px;
	}
}
</style>