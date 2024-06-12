import type { Accessor, Setter, Signal } from 'solid-js';
import { createSignal } from 'solid-js';
import type { OpaqueReactiveObjectFactory } from '../../index.ts';
import type { AnyChildNode, AnyParentNode } from '../../instance/hierarchy.ts';
import type { NodeID } from '../../instance/identity.ts';
import type { materializeCurrentStateChildren } from './materializeCurrentStateChildren.ts';
import type { ClientState } from './node-state/createClientState.ts';
import type { CurrentState } from './node-state/createCurrentState.ts';
import type { EngineState } from './node-state/createEngineState.ts';

export interface ChildrenState<Child extends AnyChildNode> {
	readonly children: Signal<readonly Child[]>;
	readonly getChildren: Accessor<readonly Child[]>;
	readonly setChildren: Setter<readonly Child[]>;
	readonly childIds: Accessor<readonly NodeID[]>;
}

/**
 * Creates a synchronized pair of:
 *
 * - Internal children state suitable for all parent node types
 * - The same children state computed as an array of each child's {@link NodeID}
 *
 * This state is used, in tandem with {@link materializeCurrentStateChildren},
 * to ensure children in **client-facing** state are not written into nested
 * {@link OpaqueReactiveObjectFactory} calls.
 *
 * The produced {@link ChildrenState.children} (and its get/set convenience
 * methods) signal is intended to be used to store the engine's children state,
 * and update that state when appropriate (when appending children of any parent
 * node during form initialization, and when appending repeat instances and
 * their descendants subsequently during a form session).
 *
 * The produced {@link ChildrenState.childIds} memo is intended to be used to
 * specify each parent node's `children` in an instance of {@link EngineState}.
 * In so doing, the node's corresponding (internal, synchronized)
 * {@link ClientState} will likewise store only the children's {@link NodeID}s.
 *
 * As a client reacts to changes in a given parent node's `children` state, that
 * node's {@link CurrentState} should produce the child nodes corresponding to
 * those {@link NodeID}s with the aforementioned
 * {@link materializeCurrentStateChildren}.
 */
export const createChildrenState = <Parent extends AnyParentNode, Child extends AnyChildNode>(
	parent: Parent
): ChildrenState<Child> => {
	return parent.scope.runTask(() => {
		const baseState = createSignal<readonly Child[]>([]);
		const [getChildren, baseSetChildren] = baseState;

		/**
		 * Note: this is clearly derived state. It would be obvious to use
		 * `createMemo`, which is exactly what a previous iteration did. This caused
		 * mysterious issues when clients:
		 *
		 * - Also used Solid-based reactivity
		 * - Accessed node children state within their own `createMemo` calls
		 *
		 * It's quite likely that there's a more robust and general solution, which
		 * may be applicable if we also generalize this approach to
		 * encode/materialize shared structured state (e.g. it may be applicable for
		 * select values, form language, probably much more in coming features).
		 *
		 * In the meantime, while this approach is marginally more complex, it is
		 * likely also slightly more efficient. We can revisit the tradeoff if/when
		 * those hypothetical generalizations become a priority.
		 */
		const ids = createSignal<readonly NodeID[]>([]);
		const [childIds, setChildIds] = ids;

		type ChildrenSetterCallback = (prev: readonly Child[]) => readonly Child[];
		type ChildrenOrSetterCallback = ChildrenSetterCallback | readonly Child[];

		const setChildren: Setter<readonly Child[]> = (
			valueOrSetterCallback: ChildrenOrSetterCallback
		) => {
			let setterCallback: ChildrenSetterCallback;

			if (typeof valueOrSetterCallback === 'function') {
				setterCallback = valueOrSetterCallback;
			} else {
				setterCallback = (_) => valueOrSetterCallback;
			}

			return baseSetChildren((prev) => {
				const result = setterCallback(prev);

				setChildIds(() => {
					return result.map((child) => child.nodeId);
				});

				return result;
			});
		};

		const children: Signal<readonly Child[]> = [getChildren, setChildren];

		return {
			children,
			getChildren,
			setChildren,
			childIds,
		};
	});
};
