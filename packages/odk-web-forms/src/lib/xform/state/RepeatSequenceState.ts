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

		// TODO: it's trivial to use a Signal here, but it may not be the best
		// solution, both for modeling sequence state and for efficiency of the
		// computation and those which react from it. In terns of efficiency, after
		// some quick profiling, I do believe there is likely excessive computation
		// when adding repeat instances. For example, when adding a large number of
		// instances, each with computations, it would be expected that computation
		// time does not grow per instance, but it seemingly does. Some effort has
		// been made to mitigate this, making runtime growth sublinear, but it is
		// definitely sitll a clear optimization opportunity (and very likely
		// optimization will correlate with correctness issues depending on the
		// nautre of the computation[s] involved).
		//
		// Also of note: I may have been inclined to spend more time profiling
		// upfront and get ahead of this particular performance issue before it has
		// an opportunity to get entrenched, but it was challenging to separate the
		// form computation wheat from the Solid call stack chaff. I was hoping
		// `solid-devtools` may be of help here, but it was not. I don't think it
		// was worth investigating further until there are more fully functioning
		// forms to measure, but I did want to make sure all of these observations
		// have a place somewhere if/when we come back to these issues.
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

	override initializeState(): void {
		super.initializeState();
		this.getInstances().forEach((instance) => instance.initializeState());
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

			if (from == null) {
				nextInstance.initializeState();
			}

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
