<script lang="ts" setup>
import type {
	AnchorMarkdownNode,
	HtmlMarkdownNode,
	MarkdownNode,
	ParentMarkdownNode,
	StyledMarkdownNode,
} from '@getodk/xforms-engine';
import DOMPurify from 'dompurify';
import type { StyleValue } from 'vue';

interface MarkdownProps {
	readonly elem: MarkdownNode;
}

const { elem } = defineProps<MarkdownProps>();

const getStylePropertyMap = (node: ParentMarkdownNode): StyleValue | undefined => {
	const properties = (node as StyledMarkdownNode).properties;
	if (properties) {
		return properties.style as StyleValue;
	}
};

const getUrl = (node: ParentMarkdownNode): string | undefined => {
	if (node.elementName === 'a') {
		return (node as AnchorMarkdownNode).url;
	}
};

const purify = (node: HtmlMarkdownNode): string => {
	return DOMPurify.sanitize(node.unsafeHtml);
};
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
