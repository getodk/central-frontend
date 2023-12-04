import type { Accessor, Signal } from 'solid-js';
import { createComputed, createSignal, untrack } from 'solid-js';
import { createLatest } from '../../reactivity/primitives/createLatest.ts';
import { createUninitialized } from '../../reactivity/primitives/uninitialized.ts';
import type { ValueNodeDefinition } from '../model/ValueNodeDefinition.ts';
import { DescendantNodeState } from './DescendantNodeState.ts';
import type { EntryState } from './EntryState.ts';
import type { AnyParentState, NodeState } from './NodeState.ts';

export class ValueNodeState
	extends DescendantNodeState<'value-node'>
	implements NodeState<'value-node'>
{
	readonly node: Element;
	readonly children = null;

	valueState: Signal<string>;

	constructor(entry: EntryState, parent: AnyParentState, definition: ValueNodeDefinition) {
		super(entry, parent, 'value-node', definition);

		// TODO: set default value rather than `cloneNode(true)`?
		const node = definition.node.cloneNode(true) as Element;

		parent.node.append(node);
		this.node = node;
		this.valueState = createUninitialized<string>();
	}

	override initializeState(): void {
		super.initializeState();
		this.valueState = this.createValueNodeState(this.node);
	}

	/**
	 * Creates a reactive signal which computes and updates the provided node's
	 * value, as well as the signal getter's value. This handles several
	 * overlapping responsibilities:
	 *
	 * - Initial runtime state is derived first from the DOM node's value.
	 * - If a `calculate` getter is provided, its initial return value is then
	 *   used to update the signal's runtime state.
	 * - During initialization and any subsequent reactive update, if the
	 *   `isRelevant` getter returns `true`, the DOM node's value is updated with
	 *   the signal's runtime state.
	 * - If `isRelevant` returns `false`, the DOM node's value is set to blank
	 *   **but the signal's runtime state is preserved**. This ensures that the
	 *   DOM node's value can be restored if `isRelevant` returns `true` in a
	 *   future update.
	 * - Both `calculate` (if provided) and `isRelevant` are expected to be
	 *   reactive based on their dependencies (@see
	 *   {@link createBooleanBindComputation}). When they're updated, the above
	 *   logic is continually applied to both the runtime and DOM state.
	 */
	protected createValueNodeState(node: Element): Signal<string> {
		const getDOMValue = () => node.textContent ?? '';
		const setDOMValue = (value: string): string => {
			node.textContent = value;

			return value;
		};

		const [wasRelevant, setWasRelevant] = createSignal(this.isRelevant());

		// This ensures that downstream reactive dependencies are updated when the
		// signal's relevance changes, even though its **runtime value** has not
		// necessarily changed.
		const equals = (previous: string, current: string) => {
			return previous === current && this.isRelevant() === wasRelevant();
		};

		const [baseState, setState] = createSignal(getDOMValue(), { equals });

		let state: Accessor<string>;

		const { calculate, isRelevant } = this;

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
			// With `untrack`, the manually entered state is restored. Without it, the
			// calculation will be rerun and its result will override the user's
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
	}

	setValue(value: string): string {
		const [, setValue] = this.valueState;

		return setValue(() => value);
	}
}
