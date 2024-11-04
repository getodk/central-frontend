import type { Accessor } from 'solid-js';
import type { EngineXPathNode } from '../../integration/xpath/adapter/kind.ts';
import type { EngineXPathEvaluator } from '../../integration/xpath/EngineXPathEvaluator.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { DependentExpression } from '../../parse/expression/abstract/DependentExpression.ts';
import type { SubscribableDependency } from './SubscribableDependency.ts';
import type { TranslationContext } from './TranslationContext.ts';

/**
 * Provides a common interface to establish context for XPath-based
 * computations, i.e. to evaluate {@link DependentExpression}s where:
 *
 * - the expression may have dynamic dependency **references** (e.g. relative
 *   references resolve to repeat instances or their descendants)
 * - the expression may reference dynamic dependency **values** (e.g. an
 *   expression referencing the value of another node)
 * - the expression may be dependent on the form's currently active language
 *   (e.g. `jr:itext`)
 * - any dynamic case is expected to be internally reactive
 */
export interface EvaluationContext extends TranslationContext {
	/**
	 * Used to determine whether {@link contextNode} is attached to its
	 * {@link EngineXPathNode} document hierarchy.
	 *
	 * - If this function returns `true`: expressions are evaluated as defined.
	 * - If this function returns `false`: expressions are evaluated to either an
	 *   explicit default value (if provided) or an implicit default value
	 *   appropriate for the requested result type.
	 *
	 * @see {@link createComputedExpression} for further detail on the latter.
	 */
	readonly isAttached: Accessor<boolean>;

	readonly scope: ReactiveScope;
	readonly evaluator: EngineXPathEvaluator;

	/**
	 * Produces the current absolute reference to the {@link contextNode}, where
	 * the absolute `/` resolves to the active form state's primary instance root.
	 */
	readonly contextReference: Accessor<string>;

	readonly contextNode: Node;

	/**
	 * Resolves nodes corresponding to the provided node-set reference, possibly
	 * relative to the {@link EvaluationContext.contextNode}.
	 */
	getSubscribableDependenciesByReference(reference: string): readonly SubscribableDependency[];
}
