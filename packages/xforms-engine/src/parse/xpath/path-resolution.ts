import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type {
	AbsoluteLocationPathNode,
	AbsoluteRootLocationPathNode,
	FilterExprNode,
	PredicateNode,
	RelativeStepSyntaxLiteralNode,
	StepNode,
} from '@getodk/xpath/static/grammar/SyntaxNode.js';
import type { PathExpressionNode } from './semantic-analysis.ts';
import { isCurrentPath } from './semantic-analysis.ts';

type AbsolutePathHead =
	/** / - as first character in LocationPath */
	| AbsoluteRootLocationPathNode

	/** // - as first characters in LocationPath */
	| RelativeStepSyntaxLiteralNode;

/**
 * fn(...args) - as first (and potentially only) part of a path expression,
 * where the function is either known to produce a node-set result, or where
 * other aspects of the exression's syntax are inherently node-set producing.
 */
type FilterPathExprHead = FilterExprNode;

type StepLikeNode =
	/** // - shorthand for `/descendant-or-self::node()/`  */
	| RelativeStepSyntaxLiteralNode

	/** Any _actual_ Step in a LocationPath */
	| StepNode;

type PathNodeListHead = AbsolutePathHead | FilterPathExprHead | StepLikeNode;

/**
 * A path node list is a semi-flattened representation of...
 *
 * - Any XPath LocationPath expression:
 *   - AbsoluteLocationPath
 *   - RelativeLocationPath
 *
 * - Any expression beginning with a FilterExpr which is known to produce a
 *   node-set result
 *
 * The flattening of these syntax representations is used to perform various
 * aspects of path resolution logic, accounting for complexities of XPath syntax
 * and semantics in a roughly linear/list processing manner.
 */
// prettier-ignore
export type PathNodeList<
	Head extends PathNodeListHead = PathNodeListHead
> = readonly [
	head: Head,
	...tail: StepLikeNode[]
];

/**
 * Produces a semi-flattened representation of an AbsoluteLocationPath.
 *
 * @see {@link PathNodeList}
 */
const absolutePathNodeList = (
	pathNode: AbsoluteLocationPathNode
): PathNodeList<AbsolutePathHead> => {
	const [head, ...tail] = pathNode.children;

	switch (head.type) {
		case 'abbreviated_absolute_location_path': {
			return head.children;
		}

		case 'absolute_root_location_path':
			return [head, ...tail];

		default:
			throw new UnreachableError(head);
	}
};

const pathNodeList = (pathNode: PathExpressionNode): PathNodeList => {
	switch (pathNode.type) {
		case 'absolute_location_path':
			return absolutePathNodeList(pathNode);

		case 'filter_path_expr':
			return pathNode.children satisfies PathNodeList<FilterExprNode>;

		case 'relative_location_path':
			return pathNode.children satisfies PathNodeList<StepLikeNode>;

		default:
			throw new UnreachableError(pathNode);
	}
};

const optionalPathNodeList = (pathNode: PathExpressionNode | null): PathNodeList | null => {
	if (pathNode == null) {
		return null;
	}

	return pathNodeList(pathNode);
};

type UnresolvedContextualizedPathListNode = FilterExprNode | StepLikeNode;

/**
 * Like {@link PathNodeList}, provides a semi-flattened representation of path
 * syntax. Distinct from that type, an unresolved list represents an
 * intermediate concatenation of:
 *
 * - A **contextual** {@link PathNodeList} against which the to-be-resolved path
 *   will eventually be resolved.
 *
 * - The same structural representation of the to-be-resolved path.
 */
type UnresolvedPathNodeList = readonly [
	head: PathNodeListHead,
	...tail: UnresolvedContextualizedPathListNode[],
];

type ResolvableTraversalType = 'parent' | 'self';

const abbreviatedStepTextToResolvableStepType = {
	'..': 'parent',
	'.': 'self',
} as const satisfies Record<string, ResolvableTraversalType>;

const getResolvableTraversalType = (syntaxNode: StepNode): ResolvableTraversalType | null => {
	const [stepTest, ...predicates] = syntaxNode.children;

	// Ensure that we preserve self/parent traversal Steps with predicates
	if (predicates.length > 0) {
		return null;
	}

	if (stepTest.type === 'abbreviated_step') {
		return abbreviatedStepTextToResolvableStepType[stepTest.text];
	}

	if (stepTest.type !== 'axis_test' || predicates.length > 0) {
		return null;
	}

	const [axisNameNode, axisTest] = stepTest.children;
	const axisName = axisNameNode.text;

	if (axisName !== 'parent' && axisName !== 'self') {
		return null;
	}

	const axisTestType = axisTest.type;

	if (
		// `self::*`, `parent::*`
		axisTestType === 'unprefixed_wildcard_name_test' ||
		// `self::node()`, `parent::node()`
		(axisTestType === 'node_type_test' && axisTest.text.startsWith('node'))
	) {
		return axisName;
	}

	return null;
};

/**
 * Resolves the component parts of an XPath LocationPath/path-like expression
 * (as represented by an {@link UnresolvedPathNodeList}
 */
const resolvePathNodeList = (nodes: UnresolvedPathNodeList): PathNodeList => {
	const [head, ...tail] = nodes;
	const lastTailIndex = tail.length - 1;

	// Local representation, mutable during resolution
	type PathNodeResolution = [...PathNodeList];

	return tail.reduce<PathNodeResolution>(
		(acc, node, index) => {
			// Because we've filtered non-`current()` cases before we reach this point,
			// we can safely assume this is a `current()` call. For resolving **nodeset
			// references** specifically, we treat this as equivalent to `.`.
			//
			// TODO: can we make this check/result more self-documenting, and reduce
			// coupling with the `current()` check? Probably! We could move the check
			// here, returning `acc` for `current()`, and returning `[node]` (i.e.
			// establishing a new absolute-like context) otherwise. It seems like we
			// could even do a similar check for the actual AbsoluteLocationPath case,
			// and probably eliminate a bunch of the special cases in the main
			// `resolvePathExpression` body.
			if (node.type === 'filter_expr') {
				return acc;
			}

			const [currentHead, ...currentTail] = acc;

			// Special case `//` shorthand (1):
			if (
				// - Current accumulated path is a single head node.
				currentTail.length === 0 &&
				// - Head is `//` shorthand.
				currentHead.type === '//' &&
				// - Current node is last in source expression.
				index === lastTailIndex
			) {
				// Even if current node could otherwise be resolved, we must append
				// because `//` without a following Step-like node does not produce a
				// valid XPath expression.
				acc.push(node);

				return acc;
			}

			// Special case `//` shorthand (2):
			//
			// Current node is `//`, and will be guaranteed (by `tree-sitter-xpath`
			// grammar) to be followed by a valid Step-like node. Append and continue.
			if (node.type === '//') {
				acc.push(node);

				return acc;
			}

			// Any further cases are Step syntax
			node satisfies StepNode;

			const traversalType = getResolvableTraversalType(node);

			if (traversalType == null) {
				acc.push(node);

				return acc;
			}

			if (traversalType === 'self') {
				return acc;
			}

			// All further cases are parent traversal, which we will resolve where
			// possible. Each variation is detailed below.
			traversalType satisfies 'parent';

			// For our resolution purposes, the following expressions are
			// functionally equivalent:
			//
			// - `$head/$currentTail/$Step-like/..`
			// - `$head/$currentTail`
			//
			// As such, when we encounter `..` which is currently preceded by
			// any non-head, Step-like node, we can remove that trailing node
			// rather than appending `..`.
			//
			// Note: `$head/..` (without any intervening Step-like nodes) is
			// more complicated. It is handled below, explaining each case in
			// greater detail.
			if (currentTail.length > 0) {
				return [currentHead, ...currentTail.slice(0, -1)];
			}

			// Resolving `$head/..`, with no intervening Step-like nodes...
			switch (currentHead.type) {
				// Head of expression is `/`. `/..` cannot resolve to any node-set,
				// but it **is a valid LocationPath expression**. We concatenate
				// here to produce that expression, as a concession that this is
				// the only valid outcome.
				case 'absolute_root_location_path':
					return [currentHead, node];

				// Head of expression is a FilterExpr. Attempting to resolve parent step
				// would lose that original context. Concatenating instead is a
				// concession to this fact: we cannot fully resolve the nodeset/path
				// path in this context.
				//
				// If the head FilterExpr is a `current()` call, it is possible that the
				// path may be further resolved against another context (likely one from
				// an outer element in the form definition, or any other case which
				// would establish further context and be reached by recursing up the
				// definition hierarchy). For now, we must accept that the resulting
				// LocationPath will not be fully resolved.
				//
				// If the FilterExpr is an `instance("id")` call, this will effectively
				// terminate resolution of the step:
				// `instance("id")/../$remainingTail` **is a valid expression**;
				// however, downstream evaluation of that expression is expected to
				// produce an empty node-set (as it traverses into a part of the
				// document outside of the subtree[s] handled by the `@getodk/xpath`
				// evaluator).
				case 'filter_expr':
					return [currentHead, node];

				// Head of expression is relative. Resolution is as follows:
				case 'step': {
					// - If head is a self-reference, we replace that head with this step.
					//   This is safe (and correct) because `./../$remainingTail` is
					//   functionally equivalent to `../$remainingTail`.
					if (getResolvableTraversalType(currentHead) === 'self') {
						return [node];
					}

					// - If head is any other Step-like node we concatenate (e.g.
					//   where head is `foo`, we will produce `foo/..`), with the same
					//   reasoning as the above FilterExpr case. And as with that
					//   case, it is possible some downstream processing may allow
					//   further resolution.
					return [currentHead, node];
				}

				// Head of current path is `//`. Above, we already handled the special
				// case where this parent traversal would be the end of the path
				// expression, so here we can safely collapse `//../$remainingTail`
				// to `//$remainingTail`
				case '//': {
					return acc;
				}

				default:
					throw new UnreachableError(currentHead);
			}
		},
		[head]
	);
};

export const resolvePath = (
	contextNode: PathExpressionNode | null,
	pathNode: PathExpressionNode
): PathNodeList => {
	const contextNodes = optionalPathNodeList(contextNode) ?? [];

	// Path expression is **resolved without context** (or as its own context) in
	// any of the following conditions...
	//
	// - No context is available
	// - Expression path is absolute
	// - Expression begins with any FilterExpr besides a `current()` call
	//
	// We still resolve the Step-like syntax parts **within the path**, e.g.
	// allowing us to collapse `Step/..` pairs.
	if (
		// - We have no context, so there's nothing to resolve the expression path
		//   against, regardless of any other factor
		contextNode == null ||
		// - Expression path is absolute, so it is its own context
		pathNode.type === 'absolute_location_path' ||
		// - Expression path has leading FilterExpr, which is **not** a call to
		//   `current()`, in which case it is treated as if it were absolute.
		(pathNode.type === 'filter_path_expr' && !isCurrentPath(pathNode))
	) {
		const pathNodes = pathNodeList(pathNode);

		return resolvePathNodeList(pathNodes);
	}

	const contextualizedNodes: UnresolvedPathNodeList = [...contextNodes, ...pathNode.children];

	return resolvePathNodeList(contextualizedNodes);
};

/**
 * Resolves the parsed path {@link predicatePathNode}, in the context of:
 *
 * - The {@link contextNode} context, representing the original expression's
 *   context (if one was available)
 *
 * - The {@link stepContextNodes} context, representing the cumulative portion
 *   of the source path where {@link predicatePathNode} was parsed from a
 *   Predicate sub-expression
 *
 * Both contexts are necessary for resolution to ensure that:
 *
 * - A `current()` call within the predicate's sub-expression is contextualized
 *   to the current `nodeset` reference associated with the original expression
 *
 * - A `.` self-reference within the predicate's sub-expression is
 *   contextualized to the Step in which it occurred
 */
export const resolvePredicateReference = (
	contextNode: PathExpressionNode | null,
	stepContextNodes: PathNodeList,
	predicatePathNode: PathExpressionNode
): PathNodeList => {
	const predicatePathNodes = pathNodeList(predicatePathNode);

	const [head, ...tail] = predicatePathNodes;

	if (head.type === 'absolute_root_location_path' || head.type === '//') {
		return predicatePathNodes;
	}

	let contextNodes: PathNodeList;

	if (
		contextNode != null &&
		predicatePathNode.type === 'filter_path_expr' &&
		isCurrentPath(predicatePathNode)
	) {
		contextNodes = pathNodeList(contextNode);
	} else {
		contextNodes = stepContextNodes;
	}

	const contextualizedNodes: UnresolvedPathNodeList = [...contextNodes, head, ...tail];

	return resolvePathNodeList(contextualizedNodes);
};
interface PathSerializationOptions {
	/**
	 * @default false
	 */
	readonly stripPredicates: boolean;
}

type AnyPathNode = PathNodeList[number];

const serializePathNode = (node: AnyPathNode, options: PathSerializationOptions): string => {
	const { type, text } = node;
	if (type === 'step') {
		switch (getResolvableTraversalType(node)) {
			case 'self':
				return '.';

			case 'parent':
				return '..';
		}
	}

	if (options.stripPredicates) {
		switch (type) {
			case 'absolute_root_location_path':
			case '//':
				return text;

			case 'filter_expr':
			case 'step': {
				const [head, ..._predicates] = node.children;

				_predicates satisfies readonly PredicateNode[];

				return head.text;
			}
		}
	}

	return text;
};

/**
 * Serializes a resolved {@link PathNodeList} to its XPath expression
 * representation, optionally stripping predicates.
 */
export const serializeNodesetReference = (
	nodes: PathNodeList,
	options: PathSerializationOptions
): string => {
	const [head, ...tail] = nodes;
	const strings: string[] = [serializePathNode(head, options)];

	let previousNode = head;

	for (const node of tail) {
		const previousNodeType = previousNode.type;

		if (
			previousNodeType !== 'absolute_root_location_path' &&
			previousNodeType !== '//' &&
			node.type !== '//'
		) {
			strings.push('/');
		}

		strings.push(serializePathNode(node, options));
		previousNode = node;
	}

	return strings.join('');
};
