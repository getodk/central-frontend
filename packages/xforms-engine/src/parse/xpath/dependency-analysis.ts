import { expressionParser } from '@getodk/xpath/expressionParser.js';
import {
	resolvePath,
	resolvePredicateReference,
	serializeNodesetReference,
} from './path-resolution.ts';
import { findPredicateReferences } from './predicate-analysis.ts';
import { findLocationPathSubExpressionNodes, getPathExpressionNode } from './semantic-analysis.ts';

interface PathResolutionOptions {
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

	/**
	 * Treats the literal sub-expression `null` as if it were a keyword. This is a
	 * deviation from XPath (where `null` would be a RelativeLocationPath
	 * referencing a child node by that name). However, in real-world usage, some
	 * forms evidently use `null` as a keyword representing a null and/or blank
	 * value.
	 *
	 * @default true
	 *
	 * @todo Some equivalent of this flag has been present, with the same default,
	 * since very early Web Forms exploratory work. At time of writing, it has
	 * never been overridden in any equivalent context. This has not been a source
	 * of any known bug/unexpected/unusual behavior. Howevever, it would probably
	 * be more robust to override the default whenever a form definition includes
	 * a node literally named `<null/>`.
	 */
	readonly simulateNullKeyword?: boolean;
}

const defaultPathResolutionOptions: Required<PathResolutionOptions> = {
	ignoreReferenceToContextPath: false,
	simulateNullKeyword: true,
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
	const { ignoreReferenceToContextPath, simulateNullKeyword } = {
		...defaultPathResolutionOptions,
		...options,
	};

	const contextNode = getPathExpressionNode(contextNodeset ?? '"not a path, null fallback"');
	const expressionRootNode = expressionParser.parse(expression).rootNode;

	let subExpressions = findLocationPathSubExpressionNodes(expressionRootNode);

	if (simulateNullKeyword) {
		subExpressions = subExpressions.filter((subExpression) => subExpression.text !== 'null');
	}

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
			resolvedPathLists.map((resovledPathList) => {
				return serializeNodesetReference(resovledPathList, {
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
