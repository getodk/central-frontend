import type { Accessor, Signal } from 'solid-js';
import { createMemo, createSignal } from 'solid-js';
import { DescendantNodeState } from './DescendantNodeState.ts';
import type { EntryState } from './EntryState.ts';
import { buildChildStates } from './EntryState.ts';
import type { AnyChildState, NodeState, RepeatModelDefinition } from './NodeState.ts';
import type { RepeatSequenceState } from './RepeatSequenceState.ts';

export class RepeatInstanceState
	extends DescendantNodeState<'repeat-instance'>
	implements NodeState<'repeat-instance'>
{
	static create(
		entry: EntryState,
		sequence: RepeatSequenceState,
		modelDefinition: RepeatModelDefinition,
		previousInstance: RepeatInstanceState | null
	): RepeatInstanceState {
		const previousNode = previousInstance?.node ?? sequence.node;
		const node = modelDefinition.node.cloneNode(false) as Element;
		const index = (previousInstance?.getIndex() ?? -1) + 1;

		previousNode.after(node);

		return new this(entry, sequence, modelDefinition, node, index);
	}

	protected override referenceMemo: Accessor<string> | null = null;

	override get reference(): string {
		let { referenceMemo } = this;

		if (referenceMemo == null) {
			referenceMemo = createMemo(() => {
				return `${this.parent.reference}[${this.getIndex() + 1}]`;
			});

			this.referenceMemo = referenceMemo;
		}

		return referenceMemo();
	}

	protected readonly indexState: Signal<number>;

	readonly children: readonly AnyChildState[];

	readonly valueState = null;

	protected constructor(
		entry: EntryState,
		parent: RepeatSequenceState,
		definition: RepeatModelDefinition,
		readonly node: Element,
		index: number
	) {
		super(entry, parent, 'repeat-instance', definition);

		const indexState = createSignal(index);

		this.indexState = indexState;
		this.children = buildChildStates(entry, this);
	}

	override initializeState(): void {
		super.initializeState();

		const { definition, entry } = this;

		if (definition.type === 'repeat-template') {
			const uninitialized = entry.getUninitializedDescendants(this);

			uninitialized.forEach((state) => {
				state.initializeState();
			});
		}
	}

	/**
	 * Index of instance in containing sequence (zero-based, local to containing
	 * indexed nodeset reference).
	 */
	getIndex(): number {
		const [index] = this.indexState;

		return index();
	}

	// TODO: this performs two state updates, and it is expected to be called
	// during a user interaction (i.e. an event handler). My understanding of how
	// this works in Solid is that these state changes will not be batched, and in
	// fact they may under certain circumstances (e.g. if for whatever reason it
	// becomes async) need to be wrapped in `runWithOwner`. Deferring all of that
	// for now until there's more measurement to gain clarity about any potential
	// for overcomputation.
	remove() {
		this.node.remove();
		this.parent.removeInstance(this);
		this.setIndex(-1);
	}

	setIndex(index: number) {
		const [, setIndex] = this.indexState;

		setIndex(index);
	}
}
