import type { SubtreeDefinition } from '../model/SubtreeDefinition.ts';
import { DescendantNodeState } from './DescendantNodeState.ts';
import type { EntryState } from './EntryState.ts';
import { buildChildStates } from './EntryState.ts';
import type { AnyChildState, AnyParentState, NodeState } from './NodeState.ts';

export class SubtreeState extends DescendantNodeState<'subtree'> implements NodeState<'subtree'> {
	readonly children: readonly AnyChildState[];
	readonly valueState = null;
	readonly node: Element;

	constructor(entry: EntryState, parent: AnyParentState, definition: SubtreeDefinition) {
		super(entry, parent, 'subtree', definition);

		const node = definition.node.cloneNode(false) as Element;

		parent.node.append(node);
		this.node = node;

		this.children = buildChildStates(entry, this);
	}
}
