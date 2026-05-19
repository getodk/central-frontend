import type { PathNodeList } from './path-resolution.ts';
import type { PathExpressionNode } from './semantic-analysis.ts';
import { findLocationPathSubExpressionNodes } from './semantic-analysis.ts';

/**
 * Represents a pair of:
 *
 * - Path expression syntax referenced within a particular predicate, on any
 *   Step within a source LocationPath and/or FilterExpr path. This
 *   sub-expression is resolved as a member of the dependencies which may be
 *   referenced by any arbitrary form expression.
 *
 * - The cumulative set of path nodes, from the start of the source path
 *   expression, to the Step and Predicate where the sub-expression reference
 *   was identified. This representation is used as **part** of the context used
 *   to resolve the identified Predicate sub-expression for downstream
 *   dependency subscriptions. (Each predicate sub-expression is **further
 *   contextualized** by the original context in which the source path is
 *   defined.)
 */
export interface PredicateReference {
	readonly predicatePathNode: PathExpressionNode;
	readonly stepContextNodes: PathNodeList;
}

/**
 * Identifies path sub-expressions within any of a path's Predicates, along with
 * the step context in which they are found.
 *
 * @see {@link PredicateReference} for details on the produced structures.
 */
export const findPredicateReferences = (pathNodes: PathNodeList): readonly PredicateReference[] => {
	const [head, ...tail] = pathNodes;

	return pathNodes.flatMap((targetNode, i) => {
		const cumulativePath: PathNodeList = [head, ...tail.slice(0, i)];

		switch (targetNode.type) {
			case 'absolute_root_location_path':
			case '//':
				return [];
		}

		const [, ...predicates] = targetNode.children;

		if (predicates.length === 0) {
			return [];
		}

		return predicates.flatMap((predicate) => {
			const predicateSubExpressions = findLocationPathSubExpressionNodes(predicate);

			return predicateSubExpressions.map((predicatePathNode) => {
				return {
					predicatePathNode,
					stepContextNodes: cumulativePath,
				};
			});
		});
	});
};
