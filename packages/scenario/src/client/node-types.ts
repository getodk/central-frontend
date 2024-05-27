import type {
	AnyLeafNode,
	AnyNode,
	GroupNode,
	RepeatInstanceNode,
	RepeatRangeNode,
	RootNode,
	SelectNode,
	StringDefinition,
	StringNode,
} from '@getodk/xforms-engine';

export type { GroupNode, RepeatInstanceNode, RepeatRangeNode, RootNode, SelectNode, StringNode };

interface StringInputDefinition extends StringDefinition {
	readonly bodyElement: Exclude<StringDefinition['bodyElement'], null>;
}

export interface StringInputNode extends StringNode {
	readonly definition: StringInputDefinition;
}

export const isStringInputNode = (node: StringNode): node is StringInputNode => {
	return node.definition.bodyElement != null;
};

interface ModelOnly {
	readonly definition: {
		readonly bodyElement: null;
	};
}

// prettier-ignore
export type ModelNode = Extract<AnyNode, ModelOnly>;

type ValueNodeType = AnyLeafNode['nodeType'];

type TypedValueNode<Type extends ValueNodeType> = Extract<AnyLeafNode, { readonly nodeType: Type }>;

// prettier-ignore
type ExtractModelOnlyDefinition<Definition> =
	& Definition
	& { readonly bodyElement: null };

// prettier-ignore
type ExtractModelOnlyNode<Node extends AnyNode> =
	& Node
	& { readonly definition: ExtractModelOnlyDefinition<Node['definition']> };

export type ModelValueNode = {
	[Type in ValueNodeType]: null extends TypedValueNode<Type>['definition']['bodyElement']
		? ExtractModelOnlyNode<TypedValueNode<Type>>
		: never;
}[ValueNodeType];

export const isModelValueNode = (node: AnyNode): node is ModelValueNode => {
	return node.currentState.children == null && node.definition.bodyElement == null;
};
