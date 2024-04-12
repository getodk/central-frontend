import type { ReactiveScope } from '../../lib/reactivity/scope.ts';
import type { EvaluationContext } from './EvaluationContext.ts';

/**
 * Provides a common interface to explicitly establish a reactive subscription
 * to a form node, regardless of which node-specific details might trigger
 * reactive updates. This is primarily intended for use in coordination with a
 * node's {@link EvaluationContext} interface, so that computed expression
 * evaluations can be re-executed when their dependencies update, without
 * requiring a given evaluation to handle node-specific logic to determine
 * when/whether updates have occurred.
 *
 * @example Given a form with these bindings:
 *
 * ```xml
 * <bind nodeset="/data/field-1" />
 * <bind nodeset="/data/field-2" type="int" />
 * <bind nodeset="/data/group-a" relevant="/data/field-1 != ''" />
 * <bind nodeset="/data/group-a/field-a-1" calculate="/data/field-2 * 2" />
 * ```
 *
 * The field `/data/group-a/field-a-1`'s calculate has two dependencies:
 *
 * - `/data-field-2` (explicit)
 * - `/data/group-a` (implicit: non-relevance is inherited)
 *
 * (This is an oversimplification, but it helps to illustrate the concept.)
 *
 * The first dependency's subscription is clearly concerned with that leaf
 * node's value. In which case, that node's `subscribe` method should react to
 * updates to its value (e.g. its `currentState.value` or the internal reactive
 * representation thereof).
 *
 * Whereas the second dependency has no value (no parent nodes do); instead, the
 * subscription would be concerned with that node's relevance. In which case,
 * that node's `subscribe` method should react to updates to its relevance state
 * (e.g. its `currentState.relevant` or the internal reactive represeentation
 * thereof).
 *
 * @example Given a form with:
 *
 * ```xml
 * <!-- model -->
 * <bind nodeset="/data/repeat-a/field-a-1" calculate="position(..)" />
 * <!-- body -->
 * <repeat nodeset="/data/repeat-a" />
 * ```
 *
 * The field `/data/repeat-a/field-a-1` has a dependency on its containing
 * repeat instance. That node also doesn't have a value, and here the dynamic
 * aspect of the dependency is the node's current position. Here the node's
 * `subscribe` method should react to changes in its position (likely indirectly
 * by reading its `contextReference`).
 *
 * @see {@link EvaluationContext}
 * @see {@link EvaluationContext.contextReference}
 */
export interface SubscribableDependency {
	readonly scope: ReactiveScope;
	readonly subscribe: VoidFunction;
}
