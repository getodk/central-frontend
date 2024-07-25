import { expressionParser } from '@getodk/xpath/expressionParser.js';
import type {
	AbsoluteLocationPathNode,
	AnySyntaxNode,
	ArgumentNode,
	FilterExprNode,
	FilterPathExprNode,
	FunctionCallNode,
	FunctionNameNode,
	RelativeLocationPathNode,
} from '@getodk/xpath/static/grammar/SyntaxNode.js';
import type { AnySyntaxType } from '@getodk/xpath/static/grammar/type-names.js';
import {
	collectTypedNodes,
	findTypedPrincipalExpressionNode,
	isCompleteSubExpression,
} from './syntax-traversal.ts';

// prettier-ignore
type LocalNameLiteral<LocalName extends string> =
	| LocalName
	| `${string}:${LocalName}`;

interface LocalNamedFunctionNameNode<LocalName extends string> extends FunctionNameNode {
	readonly text: LocalNameLiteral<LocalName>;
}

// prettier-ignore
type LocalNamedFunctionCallLiteral<
	LocalName extends string
> = `${LocalNameLiteral<LocalName>}(${string})`;

interface LocalNamedFunctionCallNode<LocalName extends string> extends FunctionCallNode {
	readonly children: readonly [
		name: LocalNamedFunctionNameNode<LocalName>,
		...arguments: ArgumentNode[],
	];
	readonly text: LocalNamedFunctionCallLiteral<LocalName>;
}

const isCallToLocalNamedFunction = <LocalName extends string>(
	syntaxNode: FunctionCallNode,
	localName: LocalName
): syntaxNode is LocalNamedFunctionCallNode<LocalName> => {
	const [functionNameNode] = syntaxNode.children;
	const [localNameNode] = collectTypedNodes(['local_part', 'unprefixed_name'], functionNameNode);

	return localNameNode?.text === localName;
};

type ArgumentTypes = readonly [AnySyntaxType, ...AnySyntaxType[]];

const hasCallSignature = (
	syntaxNode: FunctionCallNode,
	expected: readonly ArgumentTypes[]
): boolean => {
	const [, ...argumentNodes] = syntaxNode.children;

	if (argumentNodes.length === 0 && expected.length === 0) {
		return true;
	}

	if (argumentNodes.length > expected.length) {
		return false;
	}

	return expected.every((types, i) => {
		const argumentNode = argumentNodes[i];

		if (argumentNode == null) {
			return false;
		}

		const [firstMatch] = collectTypedNodes(types, argumentNode);

		return firstMatch != null && isCompleteSubExpression(argumentNode, firstMatch);
	});
};

const isTranslationFunctionCall = (syntaxNode: FunctionCallNode): boolean => {
	return (
		isCallToLocalNamedFunction(syntaxNode, 'itext') &&
		hasCallSignature(syntaxNode, [
			['string_literal', 'absolute_location_path', 'relative_location_path'],
		])
	);
};

export type TranslationExpression = LocalNamedFunctionCallLiteral<'itext'>;

/**
 * Determines if an arbitrary XPath expression is (in whole) a translation
 * expression (i.e. a call to `jr:itext`).
 *
 * @todo We may also want a companion function: `hasTranslationExpression`,
 * which could be used for `<label ref>`/`<hint ref>` or anywhere else that an
 * arbitrary expression may call `jr:itext`.
 */
export const isTranslationExpression = (
	expression: string
): expression is TranslationExpression => {
	const { rootNode } = expressionParser.parse(expression);
	const functionCallNode = findTypedPrincipalExpressionNode(['function_call'], rootNode);

	if (functionCallNode == null) {
		return false;
	}

	return isTranslationFunctionCall(functionCallNode);
};

const isCurrentFunctionCall = (syntaxNode: FunctionCallNode): boolean => {
	return isCallToLocalNamedFunction(syntaxNode, 'current') && hasCallSignature(syntaxNode, []);
};

/**
 * Predicate to determine if a FilterPathExpr (as currently produced by
 * `tree-sitter-xpath`) is one of:
 *
 * - `current()`
 * - `current()/...` (where `...` represents additional steps)
 * - `current()//...` (^)
 *
 * @todo XPath grammar technically also allows for FilterExpr[Predicate],
 * and our `tree-sitter-xpath` grammar/parser also allow for this. But
 * `@getodk/xpath` types do not currently acknowledge this possibility.
 */
export const isCurrentPath = (syntaxNode: FilterPathExprNode): boolean => {
	const [filterExprNode] = syntaxNode.children;
	const [anyExprNode] = filterExprNode.children;

	return anyExprNode.type === 'function_call' && isCurrentFunctionCall(anyExprNode);
};

const isInstanceFunctionCall = (syntaxNode: FunctionCallNode): boolean => {
	return (
		isCallToLocalNamedFunction(syntaxNode, 'instance') &&
		hasCallSignature(syntaxNode, [
			// Specified as `instance("id")`, but do we really care about the argument's
			// type here?
			['argument'],
		])
	);
};

/**
 * Predicate to determine if a FilterPathExpr (as currently produced by
 * `tree-sitter-xpath`) is one of:
 *
 * - `instance("id")`
 * - `instance("id")/...` (where `...` represents additional steps)
 * - `instance("id")//...` (^)
 *
 * @todo XPath grammar technically also allows for FilterExpr[Predicate],
 * and our `tree-sitter-xpath` grammar/parser also allow for this. But
 * `@getodk/xpath` types do not currently acknowledge this possibility.
 */
const isInstancePath = (syntaxNode: FilterPathExprNode): boolean => {
	const [filterExprNode] = syntaxNode.children;
	const [anyExprNode] = filterExprNode.children;

	return anyExprNode.type === 'function_call' && isInstanceFunctionCall(anyExprNode);
};

/**
 * Determines whether a given [sub-]expression:
 *
 * - Begins with FilterExpr syntax
 * - Has any syntactic indication that the expression will produce a node-set
 *
 * This is a last/best effort means to identify aspects of XPath syntax which
 * should be treated as a node-set expression, but isn't currently handled by
 * more explicit checks like {@link isCurrentPath} and {@link isInstancePath}.
 */
const isArbitraryFilterPath = (syntaxNode: FilterPathExprNode): boolean => {
	const [filterExprNode, ...steps] = syntaxNode.children;
	const [anyExprNode, ...predicates] = filterExprNode.children;

	/**
	 * @todo This is an oversight in the **types** for {@link FilterExprNode}! The
	 * `@getodk/tree-sitter-xpath` parser (correctly) parses predicates following
	 * a FilterExpr. This case was missed when defining the static types in
	 * `@getodk/xpath`.
	 *
	 * Addressing this oversight would also imply addressing the oversight in the
	 * `xpath` runtime.
	 *
	 * To reviewer: I caught this issue in previous iterations on this set of
	 * changes. I have tests and a fix stashed, and I'd be happy to bring it into
	 * scope if preferred.
	 *
	 * When fixed, this `satisfies` check will fail. In either case, the below
	 * check will work for our semantic analysis and path resolution purproses.
	 */
	predicates satisfies readonly [];

	return anyExprNode.type === 'function_call' && (steps.length > 0 || predicates.length > 0);
};

declare const FILTER_PATH_NODE: unique symbol;

/**
 * Used to narrow types where a SyntaxNode with type 'filter_path_expr' is not
 * **known to produce** a node-set result.
 *
 * This addresses some awkwardness in the XPath grammar (and our implementation
 * parsing it) where FilterExpr _may be_ a FunctionCall, and one of the
 * following _may also be true_:
 *
 * - The function call is known by name to produce a node-set result, **OR**
 *
 * - The function call is followed by one or more Steps (or the Step-like '//'
 *   shorthand), which must produce a node-set **OR**
 *
 * - The function call is followed by one or more Predicates, which must produce
 *   a node-set
 *
 * Any other FilterExpr (and thus our containing synthetic 'filter_path_expr'
 * SyntaxNode) is treated as a non-path [sub-]expression, excluding it from
 * analysis as such (and any downstream logic such as nodeset resolution).
 */
export interface FilterPathNode extends FilterPathExprNode {
	readonly [FILTER_PATH_NODE]: true;
}

/**
 * Determines whether a given expression beginning with a FilterExpr is known to
 * produce a node-set result. Used in downstream dependency analysis, as well as
 * path resolution.
 */
export const isNodeSetFilterPathExpression = (
	syntaxNode: FilterPathExprNode
): syntaxNode is FilterPathNode => {
	return (
		isCurrentPath(syntaxNode) || isInstancePath(syntaxNode) || isArbitraryFilterPath(syntaxNode)
	);
};

export type PathExpressionNode =
	| AbsoluteLocationPathNode
	| FilterPathNode
	| RelativeLocationPathNode;

const isPathExpression = (syntaxNode: AnySyntaxNode | null): syntaxNode is PathExpressionNode => {
	if (syntaxNode == null) {
		return false;
	}

	const { type } = syntaxNode;

	return (
		type === 'absolute_location_path' ||
		type === 'relative_location_path' ||
		(type === 'filter_path_expr' && isNodeSetFilterPathExpression(syntaxNode))
	);
};

type PathExpressionType = PathExpressionNode['type'];

const pathExpressionTypes = [
	'absolute_location_path',
	'filter_path_expr',
	'relative_location_path',
] satisfies [PathExpressionType, PathExpressionType, PathExpressionType];

/**
 * Locates sub-expression {@link PathExpressionNode}s within a parsed XPath
 * expression (or any arbitrary sub-expression thereof).
 */
export const findLocationPathSubExpressionNodes = (
	syntaxNode: AnySyntaxNode
): readonly PathExpressionNode[] => {
	const baseResults = collectTypedNodes(pathExpressionTypes, syntaxNode);

	return baseResults.flatMap((node) => {
		// Note: `collectTypedNodes`, as called, is shallowly recursive. Our intent
		// is to operate on complete path expressions, relying on downstream logic
		// to determine if and how deeper recursion is appropriate.
		//
		// In this case, we treat paths beginning with a FilterExpr -> FunctionCall
		// as a special case, where we also manually walk the FunctionCall's
		// Arguments. The shallow search performed by `collectTypedNodes` is
		// important here, ensuring we can target further recursion into this syntax
		// case without applying the same logic to other parts of an identified path
		// sub-expression (i.e. allowing specialized contextualization and analysis
		// of Predicates downstream).
		if (node.type === 'filter_path_expr' && isNodeSetFilterPathExpression(node)) {
			const [filterExprNode] = node.children;
			const [functionCallNode] = filterExprNode.children;

			// This only satisfies the type checker. We could complicate
			// `FilterPathNode` to eliminate it, but seems reasonable for now.
			if (functionCallNode.type !== 'function_call') {
				return node;
			}

			const [, ...argumentNodes] = functionCallNode.children;

			argumentNodes satisfies readonly ArgumentNode[];

			const argumentResults = argumentNodes.flatMap((argumentNode) => {
				return findLocationPathSubExpressionNodes(argumentNode);
			});

			return [node, ...argumentResults];
		}

		if (isPathExpression(node)) {
			return node;
		}

		return node.children.flatMap(findLocationPathSubExpressionNodes);
	});
};

/**
 * Gets the parsed representation of an XPath path expression, iff the complete
 * expression is any {@link PathExpressionNode} syntax type.
 */
export const getPathExpressionNode = (expression: string): PathExpressionNode | null => {
	const { rootNode } = expressionParser.parse(expression);
	const result = findTypedPrincipalExpressionNode(pathExpressionTypes, rootNode);

	if (isPathExpression(result)) {
		return result;
	}

	return null;
};
