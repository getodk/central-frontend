import { UpsertableMap } from '@odk/common/lib/collections/UpsertableMap.ts';
import type { Accessor } from 'solid-js';
import {
	createComputed,
	createEffect,
	createMemo,
	createResource,
	createSignal,
	on,
	untrack,
} from 'solid-js';
import type { XFormEntry } from '../xform/XFormEntry.ts';
import { XFormEntryBinding } from '../xform/XFormEntryBinding.ts';
import type {
	BindExpression,
	BindExpressionEvaluation,
	BindExpressionEvaluationType,
} from '../xform/XFormModelBind.ts';
import { createLatest } from './primitives/createLatest.ts';

// TODO: the assumption here is that an XForm may only bind elements and attributes.
// Is that assumption correct?
type ModelNode = Attr | Element;

const isModelAttribute = (node: ModelNode): node is Attr => node.nodeType === Node.ATTRIBUTE_NODE;

const isModelElement = (node: ModelNode): node is Element => node.nodeType === Node.ELEMENT_NODE;

/**
 * Only `Element`s which have no children in XForm model should read/write model values
 * (I think?!)
 */
interface ModelValueElement extends Element {
	readonly childElementCount: 0;
}

type ModelValueNode = Attr | ModelValueElement;

const isModelValueNode = (node: ModelNode): node is ModelValueNode =>
	isModelAttribute(node) || (isModelElement(node) && node.childElementCount === 0);

type ValueSetter<T> = (value: T) => T;
type ValueSetterSignal<T> = readonly [get: Accessor<T>, set: ValueSetter<T>];
type ModelStateSignal = ValueSetterSignal<string>;

const modelStates = new UpsertableMap<ModelNode, ModelStateSignal>();

/**
 * Creates a reactive signal which computes and updates the provided node's
 * value, as well as the signal getter's value. This handles several overlapping
 * responsibilities:
 *
 * - Initial runtime state is derived first from the DOM node's value.
 * - If a `calculate` getter is provided, its initial return value is then used
 *   to update the signal's runtime state.
 * - During initialization and any subsequent reactive update, if the
 *   `isRelevant` getter returns `true`, the DOM node's value is updated with
 *   the signal's runtime state.
 * - If `isRelevant` returns `false`, the DOM node's value is set to blank **but
 *   the signal's runtime state is preserved**. This ensures that the DOM node's
 *   value can be restored if `isRelevant` returns `true` in a future update.
 * - Both `calculate` (if provided) and `isRelevant` are expected to be reactive
 *   based on their dependencies (@see {@link createBindExpressionEvaluation}).
 *   When they're updated, the above logic is continually applied to both the
 *   runtime and DOM state.
 */
const createModelState = (
	node: ModelValueNode,
	calculate: Accessor<string> | null,
	isRelevant: Accessor<boolean>
): ModelStateSignal => {
	return modelStates.upsert(node, () => {
		let getDOMValue: () => string;
		let setDOMValue: (value: string) => string;

		if (isModelAttribute(node)) {
			getDOMValue = () => node.value;
			setDOMValue = (value) => {
				return (node.value = value);
			};
		} else {
			getDOMValue = () => node.textContent ?? '';
			setDOMValue = (value) => {
				return (node.textContent = value);
			};
		}

		const [wasRelevant, setWasRelevant] = createSignal(isRelevant());

		// This ensures that downstream reactive dependencies are updated when the
		// signal's relevance changes, even though its **runtime value** has not
		// necessarily changed.
		const equals = (previous: string, current: string) => {
			return previous === current && isRelevant() === wasRelevant();
		};

		const [baseState, setState] = createSignal(getDOMValue(), { equals });

		let state: Accessor<string>;

		if (calculate == null) {
			state = baseState;
		} else {
			// As the name states, calculations are only performed when a question is
			// relevant. Returns the current state otherwise.
			//
			// On its own, this wouldn't warrant a comment. But there's an important
			// subtlety in the use of `untrack` to check relevance, which ensures the
			// expected behavior in the following scenario:
			//
			// 1. Question is relevant
			// 2. Question is calculated
			// 3. User manually enters question state
			// 4. Question becomes non-relevant
			// 5. Question relevance is restored
			//
			// With `untrack`, the manually entered state is restored. Without it,
			// the calculation will be rerun and its result will override the user's
			// manually entered state.
			const calculateWhenRelevant = () => {
				if (untrack(isRelevant)) {
					return calculate();
				}

				return baseState();
			};

			state = createLatest([baseState, calculateWhenRelevant]);
			setState(baseState());
		}

		createComputed(() => {
			const isCurrentlyRelevant = isRelevant();
			const currentState = isCurrentlyRelevant ? state() : baseState();

			setState(currentState);
			setDOMValue(isCurrentlyRelevant ? currentState : '');
			setWasRelevant(isCurrentlyRelevant);

			return isCurrentlyRelevant;
		}, isRelevant());

		return [state, setState];
	});
};

/**
 * Creates a reactive getter which produces the evaluated result for the
 * provided {@link BindExpression} on initialization, and whenever the state
 * (runtime or DOM, @see {@link createModelState}) of any of its dependencies
 * is updated.
 */
// TODO: it probably makes most sense for inheritance to be handled here as an
// explicit option, as it's more general than I'd originally thought.
const createBindExpressionEvaluation = <T extends BindExpressionEvaluationType>(
	entry: XFormEntry,
	binding: XFormEntryBinding,
	expression: BindExpression<T>,
	defaultAccessor: Accessor<BindExpressionEvaluation<T>> | null = null
): Accessor<BindExpressionEvaluation<T>> => {
	if (expression.expression == null && defaultAccessor != null) {
		return defaultAccessor;
	}

	const evaluateExpression = () => {
		return expression.evaluate(
			entry.instanceDOM.primaryInstanceEvaluator,
			binding.getModelElement()
		);
	};

	const [accessor, { refetch }] = createResource(evaluateExpression, {
		initialValue: evaluateExpression(),
	});

	const dependencies = expression.dependencyExpressions.map((dependencyExpression) => {
		const dependencyBinding = entry.getBinding(dependencyExpression);

		if (dependencyBinding == null) {
			console.error('No binding for dependency', dependencyExpression);

			return NOOP_BINDING_STATE;
		}

		return getBindingState(entry, dependencyBinding);
	});
	const dependencyValueAccessors = dependencies.map((dependency) => dependency.getValue);

	createEffect(
		on(dependencyValueAccessors, () => {
			// TODO: resources are probably not the best fit for this use case,
			// because they're intended for async... well, resources...

			// But they have the most obvious API for re-evaluation when dependencies
			// change. Generally, effects are not supposed to update reactive state. It
			// may be that this is actually an appropriate exception to that generality.
			// Probably a good idea to ask for clarification.
			//
			// Anyway, that's why there's this weird `void` operator. Because eslint and
			// @typescript-eslint correctly question the `refetch` call without awaiting
			// its implicit `Promise`.
			//
			// Also TODO: does it **actually** return a promise for synchronous "fetch"?
			void refetch();
		})
	);

	return accessor;
};

export interface BindingState {
	/**
	 * Returns the binding's **runtime value**. This value may differ from its
	 * state in the submission DOM: if the binding is presently non-relevant, its
	 * DOM value will be blank but its runtime value will remain set to whatever
	 * it had been prior to becoming non-relevant.
	 *
	 * This interface-level distinction may change if it turns out to be
	 * confusing. The preservation of state will remain, as it is expected
	 * behavior for relevance, but we may consider producing the same non-relevant
	 * blank value when calling this getter.
	 */
	readonly getValue: Accessor<string>;

	/**
	 * Per ODK XForms spec:
	 *
	 * > As in
	 * > {@link https://www.w3.org/TR/2003/REC-xforms-20031014/slice6.html#model-prop-readOnly | XForms 1.0}
	 * > [...]
	 *
	 * While the ODK spec is not explicit about inheritance, according to the
	 * linked W3C XForms spec:
	 *
	 * > If any ancestor node evaluates to true, this value is treated as true.
	 * > Otherwise, the local value is used.
	 */
	readonly isReadonly: Accessor<boolean>;

	/**
	 * Per ODK XForms spec:
	 *
	 * > As in
	 * > {@link https://www.w3.org/TR/2003/REC-xforms-20031014/slice6.html#model-prop-relevant | XForms 1.0}
	 * > [...]
	 *
	 * Which states:
	 *
	 * > If any ancestor node evaluates to XPath false, this value is treated as
	 * > false. Otherwise, the local value is used.
	 */
	readonly isRelevant: Accessor<boolean>;

	/**
	 * Consistent with ODK and W3C XForms specifications; as such, it is not
	 * inherited. TODO: what does it mean for a group to be required if none of
	 * its descendants are?
	 */
	readonly isRequired: Accessor<boolean>;

	/**
	 * Sets the binding's **runtime value**, which may differ from its value in
	 * the submission DOM: if the question is not relevant, its DOM value will
	 * remain blank.
	 *
	 * This setter should be used when a value is set by explicit user
	 * interaction, or any equivalent action which would set user-defined state.
	 *
	 * TODO: What restrictions should be placed on this setter when...
	 *
	 * - non-relevant
	 * - readonly
	 *
	 * Instinctually, both should prevent setting any value.
	 */
	readonly setValue: ValueSetter<string>;
}

const NOOP_BINDING_STATE: BindingState = (() => {
	const getValue = () => '';
	const setValue = () => {
		throw new Error('Setting state failed: this is an artificial BindingState object');
	};

	return {
		getValue,
		isReadonly: () => false,
		isRelevant: () => true,
		isRequired: () => false,
		setValue,
		state: [getValue, setValue],
	};
})();

const bindingStates = new UpsertableMap<XFormEntryBinding, BindingState>();

/**
 * Creates a reactive {@link BindingState} for the provided
 * {@link XFormEntryBinding | binding}.
 *
 * @see {@link createModelState} and {@link createBindExpressionEvaluation},
 * which cover the vast majority of this behavior.
 *
 * An exception is made for the state/value of model elements which are not leaf
 * nodes, and thus not treated as value nodes directly. Other aspects of their
 * reactive bindings are still handled to accommodate inheritance, though this
 * is currently inconsistent with the XForms spec (`relevant` is inherited as
 * expected, `readonly` inheritance isn't yet handled).
 */
export const createBindingState = (entry: XFormEntry, binding: XFormEntryBinding): BindingState => {
	return bindingStates.upsert(binding, () => {
		const { bind, parent } = binding;
		const { calculate: calculateBindExpression, readonly, relevant, required } = bind;

		const modelNode = binding.getModelElement();

		const isSelfRelevant = createBindExpressionEvaluation(
			entry,
			binding,
			relevant,
			createMemo(() => true)
		);
		const isRelevant = createMemo(() => {
			const isParentRelevant = parent == null || parent.isRelevant();

			return isParentRelevant && isSelfRelevant();
		});

		let calculate: Accessor<string> | null;

		if (calculateBindExpression.expression == null) {
			calculate = null;
		} else {
			calculate = createBindExpressionEvaluation(entry, binding, calculateBindExpression);
		}

		let state: ModelStateSignal;

		if (isModelValueNode(modelNode)) {
			state = createModelState(modelNode, calculate, isRelevant);
		} else {
			const accessor = () => '';
			const setter = () => '';

			state = [accessor, setter];
		}

		const [getState, setState] = state;

		const isSelfReadonly = createBindExpressionEvaluation(
			entry,
			binding,
			readonly,
			createMemo(() => false)
		);
		const isReadonly = createMemo(() => {
			const isParentReadonly = parent?.isReadonly() ?? false;

			return isParentReadonly || isSelfReadonly();
		});

		return {
			getValue: getState,
			isReadonly,
			isRelevant,
			isRequired: createBindExpressionEvaluation(
				entry,
				binding,
				required,
				createMemo(() => false)
			),
			setValue: setState,
		};
	});
};

/**
 * @alias {@link createBindingState}
 *
 * Semantically, "create" is a bit of misnomer, the function is idempotent
 * because it creates state once per binding instance via
 * {@link bindingStates.upsert}. The "create" terminology, however, is
 * semantically consistent with Solid's reactivity factories, and that idiom is
 * consistent with the Solid ecosystem generally. This alias is just intended to
 * hopefully make the intent of its usage more clear at its call site (i.e. that
 * it is expected that the binding state has already been created, and the call
 * is expeted to resolve to an existing map entry rather than creating a new
 * one).
 */
const getBindingState = createBindingState;
