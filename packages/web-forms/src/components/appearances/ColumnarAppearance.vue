<script lang="ts" setup>
import type { SelectNodeAppearances } from '@getodk/xforms-engine';
import { computed } from 'vue';

const props = defineProps<{ appearances: SelectNodeAppearances }>();

const nColumnstyle = computed(() => {
	const numberOfColumns = [...props.appearances]
		.find((a) => /columns-\d+/.exec(a))
		?.match(/\d+/)?.[0];
	return numberOfColumns ? `grid-template-columns: repeat(${numberOfColumns}, 1fr);` : '';
});
</script>

<template>
	<div :class="[appearances['columns-pack'] ? 'columns-pack': 'columns']" :style="nColumnstyle">
		<slot />
	</div>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.columns-pack {
	display: flex;
	flex-wrap: wrap;
	gap: 10px 20px;
}

.columns {
	display: grid;
	gap: 10px 20px;
	grid-template-columns: repeat(2, 1fr);

	@media screen and (min-width: #{pf.$md}) {
		grid-template-columns: repeat(3, 1fr);
	}
	@media screen and (min-width: #{pf.$lg}) {
		grid-template-columns: repeat(4, 1fr);
	}
	@media screen and (min-width: #{pf.$xl}) {
		grid-template-columns: repeat(5, 1fr);
	}
}
</style>
