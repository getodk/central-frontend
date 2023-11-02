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

// TODO: this does not currently even attempt to find sub-expressions nested
// within sub-expressions.
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

// TODO: this is a very small subset of resolution that needs to be supported,
// and it's a hamfisted hack. **This is temporary** to unblock progress on
// computations, but a longer term solution will need to address:
//
// - non-abbreviation axes (parent, child, self) according to XForms spec
// - non-leading axes
// - context expressions which are more complex than a series of explicit
//   element name test steps (this may be fine for binds!)
const resolveRelativeSubExpression = (contextExpression: string, expression: string) => {
	const [, axisAbbreviation, relativeExpression = ''] = expression.match(/^(\.{1,2})(\/.*$)?/) ?? [
		,
		'',
		expression,
	];

	switch (axisAbbreviation) {
		case '':
			return expression;

		case '.':
			return `${contextExpression}${relativeExpression}`;

		case '..':
			return `${contextExpression.replace(/\/[^/]+$/, '')}${relativeExpression}`;
	}

	throw new Error(`Unexpected relative expression: ${expression}`);
};

interface GetNodesetDependenciesOptions {
	readonly contextExpression?: string;
}

export const getNodesetDependencies = (
	expression: string,
	options: GetNodesetDependenciesOptions = {}
): readonly string[] => {
	const { rootNode } = xpathParser.parse(expression);
	const subExpressionNodes = findLocationPathExprNodes(rootNode);
	const { contextExpression } = options;
	const subExpressions = subExpressionNodes.map((syntaxNode) => syntaxNode.text);

	if (contextExpression == null) {
		return subExpressions;
	}

	return subExpressions.map((subExpression) =>
		resolveRelativeSubExpression(contextExpression, subExpression)
	);
};
