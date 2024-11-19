import type { Accessor } from 'solid-js';
import type { engineDOMAdapter } from '../../integration/xpath/adapter/engineDOMAdapter.ts';
import type { EngineXPathNode } from '../../integration/xpath/adapter/kind.ts';
import type { EngineXPathEvaluator } from '../../integration/xpath/EngineXPathEvaluator.ts';
import type { StaticNode } from '../../integration/xpath/static-dom/StaticNode.ts';
import type { createComputedExpression } from '../../lib/reactivity/createComputedExpression.ts';
import type { createTranslationState } from '../../lib/reactivity/createTranslationState.ts';
import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { DependentExpression } from '../../parse/expression/abstract/DependentExpression.ts';
import type { InstanceNode } from '../abstract/InstanceNode.ts';
import type { PrimaryInstance } from '../PrimaryInstance.ts';
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
 *
 * Historical note: we previously utilized static analysis and a related
 * abstraction to set up reactive subscriptions to node references, values, and
 * other pertinent state changes warranting an expression's recomputation. Those
 * are still described above because they provide useful insight for the
 * **effect** of evaluating a given {@link DependentExpression}, with a given
 * {@link EvaluationContext}.
 *
 * The reactive subscription mechanism has since been largely replaced, with the
 * engine's implementation of {@link EngineXPathEvaluator} and its corresponding
 * {@link engineDOMAdapter | XPath DOM adapter implementation}.
 *
 * @todo There is still one notable exception: translation expressions (i.e.
 * expressions calling {@link https://getodk.github.io/xforms-spec/#fn:jr:itext}
 * | `jr:itext`). We still perform analysis to identify such calls, and when
 * evaluating those expressions we still explicitly subscribe to the form's
 * active language state. A further refactor, moving more of the responsibility
 * for translation state up out of `@getodk/xpath` into the engine, would likely
 * allow us to further simplify the engine's reactive XPath recomputation
 * approach.
 *
 * @see {@link createTranslationState} for additional context.
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
	 * the AbsoluteLocationPath expression `/` resolves to the active
	 * {@link PrimaryInstance}, and each Step and/or position Predicate from there
	 * corresponds to the node hierarchy descending from there.
	 */
	readonly contextReference: Accessor<string>;

	/**
	 * Note: in most cases, implementations of {@link EvaluationContext} will
	 * **also** be an implementation of {@link EngineXPathNode} (as concrete
	 * implementations of {@link InstanceNode}). This property is an intentional
	 * indirection which:
	 *
	 * - Expresses only the much more limited set of properties which must be
	 *   present to initialize computations during those nodes' construction.
	 *
	 * - Allows for a handful of cases where an {@link InstanceNode} provides the
	 *   requisite facilities for evaluating expressions in a {@link StaticNode}'s
	 *   context (itemsets being a prominent example).
	 */
	readonly contextNode: EngineXPathNode;
}
