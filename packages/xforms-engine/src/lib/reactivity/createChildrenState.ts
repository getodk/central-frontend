import { createMemo, createSignal, type Accessor, type Setter, type Signal } from 'solid-js';
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
		const children = createSignal<readonly Child[]>([]);
		const [getChildren, setChildren] = children;
		const childIds = createMemo((): readonly NodeID[] => {
			return getChildren().map((child) => child.nodeId);
		});

		return {
			children,
			getChildren,
			setChildren,
			childIds,
		};
	});
};
