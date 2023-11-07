import type { Accessor } from 'solid-js';
import {
	createComputed,
	createEffect,
	createMemo,
	createRenderEffect,
	createResource,
	createSignal,
	on,
} from 'solid-js';
import { UpsertableMap } from '../collections/UpsertableMap.ts';
import type { XFormEntry } from '../xform/XFormEntry.ts';
import { XFormEntryBinding } from '../xform/XFormEntryBinding.ts';
import type {
	BindExpression,
	BindExpressionEvaluation,
	BindExpressionEvaluationType,
} from '../xform/XFormModelBind.ts';

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

		const [state, setState] = createSignal(getDOMValue(), {
			// This ensures that downstream reactive dependencies are updated when the
			// signal's relevance changes, even though its **runtime value** has not
			// necessarily changed.
			equals: (previous, current) => {
				return previous === current && isRelevant() === wasRelevant();
			},
		});

		// TODO: This works *almost* as expected. There is currently a bug where:
		//
		// 1. Node is relevant
		// 2. Calculation is performed, and its result assigned
		// 3. State is updated directly (i.e. presumably by user input)
		// 4. Node becomes non-relevant
		// 5. Node becomes relevant once again
		// 6. Calculation is perfomed/assigned once again
		//
		// My understanding is that step 6 should instead restore the state from
		// step 3.
		if (calculate != null) {
			createRenderEffect(() => {
				if (isRelevant()) {
					setState(calculate());
				}
			});
		}

		createComputed(() => {
			const isCurrentlyRelevant = isRelevant();

			if (isCurrentlyRelevant !== wasRelevant()) {
				setState(state());
			}

			setDOMValue(isCurrentlyRelevant ? state() : '');
			setWasRelevant(isCurrentlyRelevant);
		});

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
		return expression.evaluate(entry.instanceDOM.primaryInstanceEvaluator, binding.getElement());
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
	readonly getValue: Accessor<string>;
	readonly isReadonly: Accessor<boolean>;
	readonly isRelevant: Accessor<boolean>;
	readonly isRequired: Accessor<boolean>;
	readonly setValue: ValueSetter<string>;
	readonly state: ValueSetterSignal<string>;
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

		const modelNode = binding.getElement();

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

		return {
			getValue: getState,
			isReadonly: createBindExpressionEvaluation(
				entry,
				binding,
				readonly,
				createMemo(() => false)
			),
			isRelevant,
			isRequired: createBindExpressionEvaluation(
				entry,
				binding,
				required,
				createMemo(() => false)
			),
			setValue: setState,
			state,
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
