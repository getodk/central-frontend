import type { Identity } from '@getodk/common/types/helpers.js';
import type {
	AnySyntaxNode,
	SyntaxNode,
	XPathNode,
} from '@getodk/xpath/static/grammar/SyntaxNode.js';
import type { AnySyntaxType } from '@getodk/xpath/static/grammar/type-names.js';

export type TypedSyntaxNode<Type extends AnySyntaxType> = Extract<
	AnySyntaxNode,
	{ readonly type: Type }
>;

type CollectedNodes<Type extends AnySyntaxType> = Identity<ReadonlyArray<TypedSyntaxNode<Type>>>;

const isTypedNodeMatch = <const Type extends AnySyntaxType>(
	types: readonly [Type, ...Type[]],
	syntaxNode: AnySyntaxNode
): syntaxNode is TypedSyntaxNode<Type> => {
	return types.includes(syntaxNode.type as Type);
};

interface CollectNodesOptions {
	readonly recurseMatchedNodes?: boolean;
}

const collectTypedChildren = <const Type extends AnySyntaxType>(
	types: readonly [Type, ...Type[]],
	currentNode: AnySyntaxNode,
	options: CollectNodesOptions = {}
): CollectedNodes<Type> => {
	return currentNode.children.flatMap((child) => {
		return collectTypedNodes(types, child, options);
	});
};

/**
 * Collects XPath {@link SyntaxNode}s matching any of the specified
 * {@link types}.
 *
 * By default, search is **shallowly recursive** (i.e. the descendants of
 * matches are not searched).
 *
 * {@link CollectNodesOptions.recurseMatchedNodes | `options.recurseMatchedNodes: true`}
 * can be specified to recursively search descendants of matches.
 *
 * This may be useful for analysis of XPath sub-expressions, for instance
 * identifying all LocationPaths referenced by a broader expression.
 */
export const collectTypedNodes = <const Type extends AnySyntaxType>(
	types: readonly [Type, ...Type[]],
	currentNode: AnySyntaxNode,
	options: CollectNodesOptions = {}
): CollectedNodes<Type> => {
	if (isTypedNodeMatch(types, currentNode)) {
		if (options.recurseMatchedNodes) {
			return [currentNode, ...collectTypedChildren(types, currentNode, options)];
		}

		return [currentNode];
	}

	return collectTypedChildren(types, currentNode, options);
};

/**
 * Predicate to determine whether {@link descendantNode} represents the complete
 * syntax of {@link subExpressionNode}. This can be useful for targeting
 * specific aspects of syntax which tend to be wrapped (sometimes several layers
 * deep) in more general syntax types.
 *
 * @example
 *
 * ```ts
 * const pathExpression = '/foo[@bar = 1]';
 * const numericExpression = '2';
 *
 * const pathRootNode = expressionParser.parse(pathExpression).rootNode;
 * //    ^?: XPathNode
 * const [pathNumberNode] = collectTypedNodes(['number'], pathRootNode);
 * //     ^?: NumberNode
 *
 * isCompleteSubExpression(pathRootNode, pathNumberNode); // false
 *
 * const numericRootNode = expressionParser.parse(numericExpression).rootNode;
 * //    ^?: XPathNode
 * const [numericNumberNode] = collectTypedNodes(['number'], numericRootNode);
 * //     ^?: NumberNode
 *
 * isCompleteSubExpression(numericRootNode, numericNumberNode); // true
 * ```
 */
export const isCompleteSubExpression = (
	subExpressionNode: AnySyntaxNode,
	descendantNode: AnySyntaxNode
): boolean => {
	return descendantNode.text.trim() === subExpressionNode.text.trim();
};

/**
 * Finds a syntax node which:
 *
 * - Matches one of the specified {@link types}, and
 * - Represents the complete expression
 *
 * This may be useful for performing semantic analysis on expressions, for
 * instance identifying when an expression **is a FunctionCall**, and producing
 * the {@link SyntaxNode} representing that FunctionCall.
 *
 * In contrast, this would produce `null` for an expression **containing a
 * FunctionCall** in some sub-expression position (e.g. the call to `position`
 * in `foo[position() = 2]`).
 */
export const findTypedPrincipalExpressionNode = <const Type extends AnySyntaxType>(
	types: readonly [Type, ...Type[]],
	xpathNode: XPathNode
): TypedSyntaxNode<Type> | null => {
	const [first, ...rest] = collectTypedNodes(types, xpathNode);

	if (first == null || rest.length > 0) {
		return null;
	}

	if (isCompleteSubExpression(xpathNode, first)) {
		return first;
	}

	return null;
};
