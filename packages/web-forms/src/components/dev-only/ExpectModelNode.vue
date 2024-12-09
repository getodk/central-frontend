<script setup lang="ts">
import type { AnyModelValueNode, AnyNode, SubtreeNode } from '@getodk/xforms-engine';
import Message from 'primevue/message';

type AnyModelNode = AnyModelValueNode | SubtreeNode;

interface ExpectModelNodeProps {
	readonly node: AnyModelNode;
}

const props = defineProps<ExpectModelNodeProps>();

const isModelNode = (node: AnyNode): node is AnyModelNode => {
	return node.nodeType === 'model-value' || node.nodeType === 'subtree';
};

const actualNode: AnyNode = props.node;

type UnexpectedNode = Exclude<AnyNode, AnyModelNode>;

let displayMessage: string | null = null;

const unexpectedNodeErrorMessage = (node: UnexpectedNode): string => {
	return `Expected model-only node. Got node with type: ${node.nodeType}`;
};

if (!isModelNode(actualNode)) {
	if (import.meta.env.DEV) {
		displayMessage = unexpectedNodeErrorMessage(actualNode);
	} else {
		// eslint-disable-next-line no-console
		console.error(unexpectedNodeErrorMessage(actualNode));
	}
}
</script>

<template>
	<template v-if="displayMessage != null">
		<Message severity="error" :closable="false">
			{{ displayMessage }}
		</Message>
	</template>
</template>
