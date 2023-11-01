import type {
	FilterPathExprNode,
	SyntaxNode,
	XPathNode,
} from '@odk/xpath/static/grammar/SyntaxNode.js';
import type {
	AbsoluteLocationPathType,
	AnySyntaxType,
	FilterPathExprType,
	RelativeLocationPathType,
} from '@odk/xpath/static/grammar/type-names.js';
import type { CollectionValues } from '../collections/types';
import { xpathParser } from './parser.ts';

// TODO: this should probably be derived from the function definitions themselves.
// They don't actually support that (yet), and some are not yet implemented.
const nodesetReturningFunctionNames = ['id', 'instance', 'current', 'randomize'] as const;

type NodesetReturningFunctionName = CollectionValues<typeof nodesetReturningFunctionNames>;

const isNodesetReturningFunctionName = (
	functionName: string
): functionName is NodesetReturningFunctionName =>
	nodesetReturningFunctionNames.includes(functionName as NodesetReturningFunctionName);

type AnySyntaxNode = SyntaxNode<AnySyntaxType, readonly AnySyntaxNode[]> | XPathNode;

type LocationPathSubExpressionType =
	| AbsoluteLocationPathType
	| FilterPathExprType
	| RelativeLocationPathType;

type LocationPathSubExpressionNode = SyntaxNode<
	LocationPathSubExpressionType,
	readonly AnySyntaxNode[]
>;

const isAnyLocationPathExprNode = (node: AnySyntaxNode): node is LocationPathSubExpressionNode => {
	const { type } = node;

	if (type === 'absolute_location_path' || type === 'relative_location_path') {
		return true;
	}

	if (type === 'filter_path_expr') {
		// TODO: all of these types probably need simplification, if they're so
		// jumbled in my own brain just a couple weeks after I committed them.
		const filterPathExprNode = node as unknown as FilterPathExprNode;
		const [filterExprChild] = filterPathExprNode.children[0].children;

		if (filterExprChild.type === 'function_call') {
			const [functionNameNode] = filterExprChild.children;
			const functionName = functionNameNode.text;

			if (isNodesetReturningFunctionName(functionName)) {
				return true;
			}
		}
	}

	return false;
};

const findLocationPathExprNodes = (
	node: AnySyntaxNode
): readonly LocationPathSubExpressionNode[] => {
	if (isAnyLocationPathExprNode(node)) {
		return [node];
	}

	return node.children.flatMap((childNode) => {
		return findLocationPathExprNodes(childNode);
	});
};

export const getNodesetSubExpressions = (expression: string): readonly string[] => {
	const { rootNode } = xpathParser.parse(expression);
	const subExpressionNodes = findLocationPathExprNodes(rootNode);

	return subExpressionNodes.map((node) => node.text);
};
