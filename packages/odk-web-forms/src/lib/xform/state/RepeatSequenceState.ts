import { isDocumentNode } from '@odk/common/lib/dom/predicates.ts';
import type { Signal } from 'solid-js';
import { createComputed, createSignal } from 'solid-js';
import type { RepeatInstanceDefinition } from '../model/RepeatInstanceDefinition.ts';
import type { RepeatSequenceDefinition } from '../model/RepeatSequenceDefinition.ts';
import { DescendantNodeState } from './DescendantNodeState.ts';
import type { EntryState } from './EntryState.ts';
import type {
	AnyNodeState,
	AnyParentState,
	NodeState,
	RepeatModelDefinition,
} from './NodeState.ts';
import { RepeatInstanceState } from './RepeatInstanceState.ts';

interface MarkerComment<Data extends string> extends Comment {
	readonly data: Data;
}

export const createMarkerComment = <Data extends string>(
	contextNode: Node,
	markerData: Data
): MarkerComment<Data> => {
	const contextDocument = isDocumentNode(contextNode)
		? contextNode
		: (contextNode.ownerDocument as XMLDocument);

	return contextDocument.createComment(markerData) as MarkerComment<Data>;
};

export type RepeatSequenceAnchorComment = MarkerComment<`repeat-sequence: ${string}`>;

export const createRepeatSequenceAnchorComment = (
	state: AnyNodeState,
	definition: RepeatSequenceDefinition
): RepeatSequenceAnchorComment => {
	return createMarkerComment(
		state.entry.xformDocument,
		`repeat-sequence: ${definition.bind.nodeset}`
	);
};

export class RepeatSequenceState
	extends DescendantNodeState<'repeat-sequence'>
	implements NodeState<'repeat-sequence'>
{
	readonly node: RepeatSequenceAnchorComment;

	readonly children = null;

	protected readonly instancesState: Signal<readonly RepeatInstanceState[]>;

	readonly valueState = null;

	constructor(entry: EntryState, parent: AnyParentState, definition: RepeatSequenceDefinition) {
		super(entry, parent, 'repeat-sequence', definition);

		const anchorNode = createRepeatSequenceAnchorComment(this, definition);

		parent.node.appendChild(anchorNode);

		this.node = anchorNode;

		const instancesState = createSignal<readonly RepeatInstanceState[]>([]);
		const [instances] = instancesState;

		createComputed(() => {
			instances().forEach((instance, index) => instance.setIndex(index));
		});

		this.instancesState = instancesState;

		definition.instances.forEach((instance) => {
			this.createInstance(instance);
		});
	}

	createInstance(from?: RepeatInstanceDefinition): readonly RepeatInstanceState[] {
		const modelDefinition: RepeatModelDefinition = from ?? this.definition.template;
		const { instancesState: instances, entry } = this;
		const [, setInstances] = instances;

		return setInstances((current) => {
			const previousInstance = current[current.length - 1] ?? null;
			const nextInstance = RepeatInstanceState.create(
				entry,
				this,
				modelDefinition,
				previousInstance
			);

			return [...current, nextInstance];
		});
	}

	getInstances(): readonly RepeatInstanceState[] {
		const [instances] = this.instancesState;

		return instances();
	}

	removeInstance(instance: RepeatInstanceState) {
		const [, setInstances] = this.instancesState;

		setInstances((instances) => {
			return instances.filter((item) => item !== instance);
		});
	}
}
