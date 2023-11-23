import { UnreachableError } from '@odk/common/lib/error/UnreachableError.ts';
import { createMemo, type Accessor } from 'solid-js';
import type { XFormXPathEvaluator } from '../../xpath/XFormXPathEvaluator.ts';
import type { XFormDOM } from '../XFormDOM.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import type { RootDefinition } from '../model/RootDefinition.ts';
import type { AnyChildState, AnyNodeState, AnyParentState, NodeState } from './NodeState.ts';
import { RepeatSequenceState } from './RepeatSequenceState.ts';
import { SubtreeState } from './SubtreeState.ts';
import { ValueNodeState } from './ValueNodeState.ts';

export const buildChildStates = (
	entry: EntryState,
	parent: AnyParentState
): readonly AnyChildState[] => {
	switch (parent.type) {
		case 'root':
		case 'repeat-instance':
		case 'subtree':
			return parent.definition.children.map((childDefinition) => {
				switch (childDefinition.type) {
					case 'subtree': {
						return new SubtreeState(entry, parent, childDefinition);
					}

					case 'repeat-sequence': {
						return new RepeatSequenceState(entry, parent, childDefinition);
					}

					case 'value-node': {
						return new ValueNodeState(entry, parent, childDefinition);
					}
				}
			});

		default:
			throw new UnreachableError(parent);
	}
};

type Reference = string;
type ReferenceStateEntry = readonly [Reference, AnyNodeState];
type ReferenceStateEntries = readonly ReferenceStateEntry[];
type ReferenceStateMap = ReadonlyMap<Reference, AnyNodeState>;

// TODO: "root" makes sense in model definition, makes less sense in state. The
// "root" of a form entry is... the entry itself. This became obvious when the
// orignal `EntryState` became effectively an object of type `{ root: RootState
// }` with some pass-through methods. This is probably the only significant
// mental model distinction between the model definition and state trees.
export class EntryState implements NodeState<'root'> {
	readonly type = 'root';
	readonly definition: RootDefinition;
	readonly reference: string;

	readonly entry = this;

	readonly parent = null;
	readonly children: readonly AnyChildState[];

	protected readonly instanceDOM: XFormDOM;

	readonly xformDocument: XMLDocument;
	readonly evaluator: XFormXPathEvaluator;

	readonly node: Element;

	readonly valueState = null;

	readonly isReadonly = () => false;
	readonly isRelevant = () => true;
	readonly isRequired = () => false;

	protected readonly referenceStateEntries: Accessor<ReferenceStateEntries>;
	protected readonly stateByReference: Accessor<ReferenceStateMap>;

	readonly instanceState: Accessor<Element>;
	readonly serializedInstanceState: Accessor<string>;

	constructor(readonly form: XFormDefinition) {
		const { root } = form.model;

		this.definition = root;
		this.reference = `/${root.nodeName}`;

		const instanceDOM = form.xformDOM.createInstance();

		this.instanceDOM = instanceDOM;
		this.xformDocument = instanceDOM.xformDocument;
		this.node = instanceDOM.primaryInstanceRoot;
		this.node.replaceChildren();

		this.evaluator = instanceDOM.primaryInstanceEvaluator;
		this.children = buildChildStates(this, this);

		const referenceStateEntries = this.createReferenceStateEntries(this);

		this.referenceStateEntries = referenceStateEntries;
		this.stateByReference = createMemo(() => new Map(referenceStateEntries()));
		this.instanceState = this.createInstanceState();
		this.serializedInstanceState = this.createSerializedInstanceState();
	}

	private createReferenceStateEntries(state: AnyParentState): Accessor<ReferenceStateEntries> {
		return createMemo(() => {
			const self = [state.reference, state] as const;
			const children = state.children.flatMap((child): ReferenceStateEntries => {
				switch (child.type) {
					case 'repeat-sequence':
						return child.getInstances().flatMap((instance) => {
							const instanceEntries = this.createReferenceStateEntries(instance);

							return instanceEntries();
						});

					case 'subtree':
						const subtreeEntries = this.createReferenceStateEntries(child);

						return subtreeEntries();

					case 'value-node':
						return [[child.reference, child]];
				}
			});

			return [self, ...children] as const;
		});
	}

	private createValueNodeDependentMemo(parent: AnyParentState): Accessor<string[]> {
		const children = parent.children.flatMap((child): Accessor<string[]> => {
			switch (child.type) {
				case 'repeat-sequence':
					return createMemo(
						() => {
							return child.getInstances().flatMap((instance) => {
								const instanceMemo = this.createValueNodeDependentMemo(instance);

								return instanceMemo();
							});
						},
						{ equals: false }
					);

				case 'subtree':
					return this.createValueNodeDependentMemo(child);

				case 'value-node':
					return () => [child.getValue()];
			}
		});

		return createMemo(() => children.flatMap((child) => child()), { equals: false });
	}

	private createInstanceState(): Accessor<Element> {
		const states = createMemo(() => {
			return this.referenceStateEntries().flatMap(([, state]) => {
				if (state.type === 'value-node') {
					const [value] = state.valueState;

					return [state.node, value()];
				}

				return [];
			});
		});

		return () => {
			states();

			return this.instanceDOM.primaryInstanceRoot;
		};
	}

	private createSerializedInstanceState(): Accessor<string> {
		return () => {
			const instance = this.instanceState();

			return instance.outerHTML;
		};
	}

	getState(reference: string): AnyNodeState | null {
		return this.stateByReference().get(reference) ?? null;
	}

	toJSON() {
		return {};
	}
}
