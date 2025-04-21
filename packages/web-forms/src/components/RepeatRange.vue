<script setup lang="ts">
import type { RepeatRangeNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import { computed } from 'vue';
import FormPanel from './FormPanel.vue';
import RepeatInstance from './RepeatInstance.vue';

const props = defineProps<{ node: RepeatRangeNode }>();

const label = computed(() => props.node.currentState.label?.asString);
</script>
<template>
	<FormPanel :title="label" :no-ui="!label" class="repeat" label-icon="icon-repeat">
		<RepeatInstance v-for="(instance, index) in node.currentState.children" :key="index" :instance="instance" :instance-index="index" />

		<div
			v-if="node.nodeType === 'repeat-range:uncontrolled'"
			class="flex justify-content-start flex-wrap"
		>
			<Button outlined severity="contrast" class="btn-add" @click="node.addInstances()">
				<span class="flex justify-content-center align-items-center p-button-label" data-pc-section="label">
					<span class="icon-add" />
					<span class="btn-add-label">
						<!-- TODO: translations -->
						Add {{ label }}
					</span>
				</span>
			</Button>
		</div>
	</FormPanel>
</template>

<style scoped lang="scss">
.repeat {
	margin-bottom: 1rem;
}

.btn-add {
	max-width: 260px;

	.btn-add-label {
		vertical-align: middle;
	}

	.icon-add {
		margin: 0 5px 0 0;
		font-size: var(--odk-icon-size);
		vertical-align: middle;
	}
}
</style>
