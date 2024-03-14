import { isDocumentNode } from '@odk-web-forms/common/lib/dom/predicates.ts';
import type { Signal } from 'solid-js';
import { batch, createComputed, createSignal, untrack } from 'solid-js';
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
	return createMarkerComment(state.entry.xformDocument, `repeat-sequence: ${definition.nodeset}`);
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
		// computation and those which react from it. In terms of efficiency, after
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
		this.instancesState = createSignal<readonly RepeatInstanceState[]>([]);

		definition.instances.forEach((instance) => {
			this.createInstance(instance);
		});
	}

	override initializeState(): void {
		super.initializeState();

		// **Important:** Update this comment if related logic in `createInstance`
		// is changed in a way that invalidates this.
		//
		// Initialize state of instances **created at entry init**. This is not
		// reactive because initialization of subsequently added repeat instances
		// (i.e. from the repeat's template, rather than instances in the form
		// definition) happens in phases. See further discussion in the
		// `createInstance` body.
		this.getInstances().forEach((instance) => {
			instance.initializeState();
		});

		createComputed(() => {
			this.getInstances().forEach((instance, index) => {
				instance.setIndex(index);
			});
		});
	}

	createInstance(from?: RepeatInstanceDefinition): RepeatInstanceState {
		const modelDefinition: RepeatModelDefinition = from ?? this.definition.template;
		const { instancesState: instances, entry } = this;
		const [, setInstances] = instances;

		// **Important:** Update the related comment in the `initializeState` body
		// if the logic below is changed.
		//
		// Repeat instance creation is a two-step process:
		//
		// 1. Create the instance and its descendants.
		// 2. Initialize the state of the instance and its descendants.
		//
		// This is conceptually the exact same logic used during form init for all
		// other state, and it ensures that state objects are present before
		// dependent state objects attempt to reference them. Repeat instances which
		// are present during init follow the same **code paths** to implement this
		// logic, but instances added afterward are necessarily a special case as
		// the initialization stack will have already exited.
		//
		// The below accounts for both scenarios (repeat instances added during
		// init, and those added after) by:
		//
		// - deferring state initialization for instances present in the form
		//   definition (i.e. those with `type: 'repeat-instance'` **in the model
		//   definition**, as those will be initialized in `initializeState`, like
		//   all other state nodes created in the init flow)
		// - eagerly initializing state for instances created afterward (i.e. those
		//   with `type: 'repeat-template'`, although this heuristic will probably
		//   not hold when `jr:count` support is introduced)
		//
		// The use of `batch` ensures state is updated atomically and synchronously
		// for post-init instance creation. It was already expected this would be
		// needed for repeat instance creation triggered at the view level, and it
		// turned out it was needed for the first test ported from JavaRosa as well,
		// so it made sense to do the batching here instead of pushing it out to all
		// call sites.
		return batch(() => {
			const currentInstances = untrack(() => this.getInstances());
			const previousInstance = currentInstances[currentInstances.length - 1] ?? null;
			const newInstance = RepeatInstanceState.create(
				entry,
				this,
				modelDefinition,
				previousInstance
			);

			setInstances([...currentInstances, newInstance]);

			if (from == null) {
				newInstance.initializeState();
			}

			return newInstance;
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
