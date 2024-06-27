import type { AnyChildNode } from '../../instance/hierarchy.ts';
import type { NodeID } from '../../instance/identity.ts';
import type { ChildrenState, createChildrenState } from './createChildrenState.ts';
import type { ClientState } from './node-state/createClientState.ts';
import type { CurrentState } from './node-state/createCurrentState.ts';
import type { ReactiveScope } from './scope.ts';

interface InconsistentChildrenStateDetails {
	readonly missingIds: readonly NodeID[];
	readonly unexpectedIds: readonly NodeID[];
}

class InconsistentChildrenStateError extends Error {
	constructor(details: InconsistentChildrenStateDetails) {
		const { missingIds, unexpectedIds } = details;

		const messageLines = ['Detected inconsistent engine/client child state.'];

		if (missingIds.length > 0) {
			const missingIdLines = missingIds.map((missingId) => {
				return `- ${missingId}`;
			});

			messageLines.push('\nMissing child nodes for ids:\n', ...missingIdLines);
		}

		if (unexpectedIds.length > 0) {
			const unexpectedIdLines = unexpectedIds.map((unexpectedId) => {
				return `- ${unexpectedId}`;
			});

			messageLines.push('\nUnexpected child nodes with ids:\n', ...unexpectedIdLines);
		}

		super(messageLines.join('\n'));
	}
}

export interface EncodedParentState {
	readonly children: readonly NodeID[];
}

/**
 * For potential use when debugging in dev mode. The assumption is that we do
 * not believe the implementation **should** produce inconsistencies between:
 *
 * 1. The internal `children` state of a node
 * 2. The corresponding, internally computed `engineState.children` node ID list
 * 3. The reactively written `clientState.children` node ID list
 * 4. The reactively read `currentState.children` node ID list
 * 5. The read state of #1 as produced when a client reads #4
 *
 * For now we can check for this in dev mode and warn if any aspect of this
 * assumption deviates from reality. We should aim to confirm this so that we
 * can confidently skip this check in production (as it would effectively be
 * wasted CPU cycles).
 *
 * @todo should we throw rather than warn until we have this confidence?
 */
const reportInconsistentChildrenState = (
	expectedClientIds: readonly NodeID[],
	actualNodes: readonly AnyChildNode[]
): void => {
	const actualIds = actualNodes.map((node) => node.nodeId);
	const missingIds = expectedClientIds.filter((expectedId) => {
		return !actualIds.includes(expectedId);
	});
	const unexpectedIds = actualIds.filter((actualId) => {
		return !expectedClientIds.includes(actualId);
	});

	if (missingIds.length > 0 || unexpectedIds.length > 0) {
		throw new InconsistentChildrenStateError({
			missingIds,
			unexpectedIds,
		});
	}
};

// prettier-ignore
export type MaterializedChildren<
	BaseState extends EncodedParentState,
	Child extends AnyChildNode | null
> =
	& Omit<BaseState, 'children'>
	& { readonly children: readonly Child[] };

/**
 * Creates a wrapper proxy around a parent node's {@link CurrentState} to map
 * `children` state, which is written to the node's (internal, synchronized)
 * {@link ClientState} as an array of {@link NodeID}s, back to the node objects
 * corresponding to those IDs.
 *
 * @see {@link createChildrenState} for further detail.
 */
export const materializeCurrentStateChildren = <
	Child extends AnyChildNode,
	ParentState extends EncodedParentState,
>(
	scope: ReactiveScope,
	currentState: ParentState,
	childrenState: ChildrenState<Child>
): MaterializedChildren<ParentState, Child> => {
	const baseState: Omit<ParentState, 'children'> = currentState;
	const proxyTarget = baseState as MaterializedChildren<ParentState, Child>;

	return new Proxy(proxyTarget, {
		get(_, key) {
			if (key === 'children') {
				const expectedChildIDs = scope.runTask(() => currentState.children);
				const children = childrenState.getChildren();

				if (import.meta.env.DEV) {
					reportInconsistentChildrenState(expectedChildIDs, children);
				}

				return children;
			}

			return baseState[key as Exclude<keyof ParentState, 'children'>];
		},
	});
};
