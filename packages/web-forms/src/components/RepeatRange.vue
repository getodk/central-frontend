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
			<Button rounded outlined class="btn-add" @click="node.addInstances()">
				<span class="p-button-label" data-pc-section="label">
					<span class="icon-add" />
					<span class="btn-add-label">Add {{ label }}</span>
				</span>
			</Button>
		</div>
	</FormPanel>
</template>

<style scoped lang="scss">

.p-button.p-button-outlined.btn-add {
	box-shadow: inset 0 0 0 1px #cbcacc;
	margin-left: 36px;
	min-width: 144px;
	font-weight: 400;
	margin-bottom: 1rem;

	&:hover {
		background: var(--primary-100);
	}

	.btn-add-label{
		vertical-align: middle;
		margin-right: 0.5rem;
	}

	.icon-add {
		margin-right: 0.5rem;
		font-size: 18px;
		vertical-align: middle;
	}
}

.repeat {
	margin-bottom: 1rem;
	
	.p-button.p-button-outlined.btn-add {
		margin-left: 25px;
		margin-bottom: 0rem;
	}
}
</style>