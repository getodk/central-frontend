<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import MarkdownBlock from '@/components/common/MarkdownBlock.vue';
import type { RepeatRangeNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import { computed } from 'vue';
import RepeatInstance from './RepeatInstance.vue';

const props = defineProps<{ node: RepeatRangeNode }>();
const label = computed(() => props.node.currentState.label?.formatted);
</script>
<template>
	<RepeatInstance v-for="(instance, index) in node.currentState.children" :key="index" :instance="instance" :instance-index="index" />

	<Button
		v-if="node.nodeType === 'repeat-range:uncontrolled'"
		outlined
		severity="contrast"
		class="button-add-instance"
		@click="node.addInstances()"
	>
		<IconSVG name="mdiPlus" />
		<!-- TODO: translations -->
		<span>Add</span>
		<MarkdownBlock v-for="(elem, index) in label" :key="index" :elem="elem" />
	</Button>
</template>

<style scoped lang="scss">
.repeat {
	margin-bottom: 1rem;
}

.button-add-instance {
	max-width: 260px;
	width: fit-content;
	margin-bottom: 20px;
}

.p-panel .button-add-instance {
	margin: 0 0 15px 15px;
}
</style>
