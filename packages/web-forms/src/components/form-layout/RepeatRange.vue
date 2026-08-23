<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import MarkdownBlock from '@/components/common/MarkdownBlock.vue';
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import { containerId } from '@/lib/format/ids.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import { isOnCurrentPage } from '@/lib/pagination/pagination.ts';
import type { RepeatRangeNode, RepeatRangeUncontrolledNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import { computed, inject } from 'vue';
import RepeatInstance from './RepeatInstance.vue';

const t: Translate = inject(TRANSLATE)!;
const props = defineProps<{ node: RepeatRangeNode }>();
const label = computed(() => props.node.currentState.label?.formatted);

const isAddButtonVisible = (range: RepeatRangeNode): range is RepeatRangeUncontrolledNode => {
	if (range.nodeType !== 'repeat-range:uncontrolled') {
		return false;
	}
	return isOnCurrentPage(range);
};
</script>
<template>
	<template v-if="node.currentState.hasVisibleBodyNodes">
		<RepeatInstance
			v-for="(instance, index) in node.currentState.children"
			:key="index"
			:instance="instance"
			:instance-index="index"
		/>
	</template>
	<Button
		v-if="isAddButtonVisible(node)"
		:id="containerId(node.nodeId)"
		outlined
		severity="contrast"
		class="button-add-instance"
		@click="node.addInstances()"
	>
		<IconSVG name="mdiPlus" />
		<span>
			{{ t('repeat.add.label') }}
			<MarkdownBlock v-for="elem in label" :key="elem.id" :elem="elem" />
		</span>
	</Button>
</template>

<style scoped lang="scss">
.repeat {
	margin-bottom: 1rem;
}

.button-add-instance {
	max-width: 260px;
	width: fit-content;
	margin-bottom: var(--odk-spacing-xl);
}

.p-panel .button-add-instance {
	margin: 0 0 var(--odk-spacing-l) var(--odk-spacing-l);
}
</style>
