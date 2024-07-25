import { expressionParser } from '@getodk/xpath/expressionParser.js';
import {
	resolvePath,
	resolvePredicateReference,
	serializeNodesetReference,
} from './path-resolution.ts';
import { findPredicateReferences } from './predicate-analysis.ts';
import type { PathExpressionNode } from './semantic-analysis.ts';
import { findLocationPathSubExpressionNodes, getPathExpressionNode } from './semantic-analysis.ts';

export interface PathResolutionOptions {
	/**
	 * Excludes direct references to the nodeset specified as a context. This flag
	 * has earlier precedent as `ignoreContextReference` in similar internal APIs.
	 * The intent, in part, is to allow for certain in-spec exceptions to cycle
	 * analysis (which we previously did explicitly, and foresee reintroducing in
	 * some form relatively soon). As such, the default for this flag should be
	 * overridden when a computation is (A) not among the core `<bind>`
	 * computations or (B) is a computation which is explicitly expected to have
	 * self-references (such as `constraint`).
	 *
	 * @default false
	 *
	 * @todo It is highly likely we will eliminate this in the future. We
	 * considered removing its precursor (and existing code now referencing this)
	 * in {@link https://github.com/getodk/web-forms/pull/67}, but ran into issues
	 * with some of the reactive logic introduced there. It's likely that
	 * subsequent improvements have addressed those issues, but it's also likely
	 * that we will want similar special casing when we reintroduce explicit graph
	 * cycle analysis.
	 */
	readonly ignoreReferenceToContextPath?: boolean;
}

const defaultPathResolutionOptions: Required<PathResolutionOptions> = {
	ignoreReferenceToContextPath: false,
};

/**
 * Resolves XPath paths referenced by an arbitrary expression to XForms
 * `nodeset` references:
 *
 * 1. The provided {@link expression} is analyzed to find path sub-expressions
 *    (LocationPaths, sub-expressions with a node-set producing FilterExpr).
 *
 * 2. When a {@link contextNodeset} is available, each sub-expression is
 *    resolved to that context. See {@link resolvePath} for additional
 *    detail.
 *
 * 3. Once resolved, each dependency path is further analyzed to identify
 *    sub-expressions in any of its predicates, resolving each to their
 *    respective predicates' Steps. See {@link resolvePredicateReference} for
 *    additional detail.
 */
export const resolveDependencyNodesets = (
	contextNodeset: string | null,
	expression: string,
	options: PathResolutionOptions = {}
): readonly string[] => {
	const { ignoreReferenceToContextPath } = {
		...defaultPathResolutionOptions,
		...options,
	};

	let contextNode: PathExpressionNode | null = null;

	if (contextNodeset != null) {
		contextNode = getPathExpressionNode(contextNodeset);
	}

	const expressionRootNode = expressionParser.parse(expression).rootNode;
	const subExpressions = findLocationPathSubExpressionNodes(expressionRootNode);

	const resolvedPathLists = subExpressions.flatMap((subExpression) => {
		const pathNodes = resolvePath(contextNode, subExpression);
		const predicateReferences = findPredicateReferences(pathNodes);
		const resolvedPredicateReferences = predicateReferences.map((reference) => {
			return resolvePredicateReference(
				contextNode,
				reference.stepContextNodes,
				reference.predicatePathNode
			);
		});

		return [pathNodes, ...resolvedPredicateReferences];
	});

	const serializedPaths = Array.from(
		new Set(
			resolvedPathLists.map((resolvedPathList) => {
				return serializeNodesetReference(resolvedPathList, {
					stripPredicates: true,
				});
			})
		)
	);

	if (ignoreReferenceToContextPath) {
		return serializedPaths.filter((result) => {
			return result !== contextNodeset;
		});
	}

	return serializedPaths;
};
