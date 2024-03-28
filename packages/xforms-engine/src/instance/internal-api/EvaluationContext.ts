import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { DependentExpression } from '../../expression/DependentExpression.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { SubscribableDependency } from './SubscribableDependency.ts';

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
export interface EvaluationContext {
	readonly scope: ReactiveScope;
	readonly evaluator: XFormsXPathEvaluator;
	readonly root: SubscribableDependency;

	/**
	 * Produces the current absolute reference to the {@link contextNode}, where
	 * the absolute `/` resolves to the active form state's primary instance root.
	 */
	get contextReference(): string;

	readonly contextNode: Node;

	/**
	 * Resolves a nodeset reference, possibly relative to the
	 * {@link EvaluationContext.contextNode}.
	 */
	readonly getSubscribableDependencyByReference: (
		reference: string
	) => SubscribableDependency | null;
}
