<script lang="ts" setup>
import { getStylePropertyMap, getUrl, purify } from '@/lib/format/markdown';
import type { MarkdownNode } from '@getodk/xforms-engine';

interface MarkdownProps {
	readonly elem: MarkdownNode;
}
const { elem } = defineProps<MarkdownProps>();
</script>

<template>
	<!-- child node -->
	<template v-if="elem.role === 'child'">
		{{ elem.value }}
	</template>

	<!-- unsafe html -->
	<!-- eslint-disable-next-line vue/no-v-html -->
	<span v-else-if="elem.role === 'html'" v-html="purify(elem)" />

	<!-- link -->
	<a v-else-if="elem.role === 'parent' && elem.elementName === 'a'" :href="getUrl(elem)" target="_blank">
		<MarkdownBlock v-for="(child, index) in elem.children" :key="index" :elem="child" />
	</a>

	<!-- any other parent element -->
	<component :is="elem.elementName" v-else-if="elem.elementName" :style="getStylePropertyMap(elem)">
		<MarkdownBlock v-for="(child, index) in elem.children" :key="index" :elem="child" />
	</component>
</template>
