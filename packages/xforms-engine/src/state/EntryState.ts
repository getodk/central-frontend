import { UnreachableError } from '@odk-web-forms/common/lib/error/UnreachableError.ts';
import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import { createMemo, type Accessor } from 'solid-js';
import type { XFormDOM } from '../XFormDOM.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import type { ModelBindMap } from '../model/ModelBindMap.ts';
import type { RootDefinition } from '../model/RootDefinition.ts';
import type { AnyDescendantNodeState } from './DescendantNodeState.ts';
import type { AnyChildState, AnyNodeState, AnyParentState, NodeState } from './NodeState.ts';
import { RepeatSequenceState } from './RepeatSequenceState.ts';
import { SubtreeState } from './SubtreeState.ts';
import { TranslationState } from './TranslationState.ts';
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

/**
 * The top level of a form entry/submission in progress which:
 *
 * - Corresponds to the submission's root node (as in
 *   `ModelDefinition` > `RootDefinition`)
 * - Initiates state and reactive computations of descendant nodes
 */
// TODO: entry -> submission? "Entry" corresponds to the verb and "submission"
// is the term used most commonly across the rest of ODK. "Entry" also has
// potential for technical/tooling confusion.
//
// TODO: "root" makes sense in model definition, makes less sense in state. The
// "root" of a form entry is... the entry itself. This became obvious when the
// orignal `EntryState` became effectively an object of type `{ root: RootState
// }` with some pass-through methods. This is probably the only significant
// mental model distinction between the model definition and state trees.
export class EntryState implements NodeState<'root'> {
	readonly type = 'root';
	readonly definition: RootDefinition;
	readonly nodeset: string;
	readonly reference: string;

	readonly isReferenceStatic: boolean = true;

	readonly entry = this;

	readonly parent = null;
	readonly children: readonly AnyChildState[];

	protected readonly instanceDOM: XFormDOM;

	readonly xformDocument: XMLDocument;
	readonly evaluator: XFormsXPathEvaluator;

	readonly translations: TranslationState | null;

	readonly node: Element;

	readonly valueState = null;

	readonly isReadonly = () => false;
	readonly isRelevant = () => true;
	readonly isRequired = () => false;

	protected readonly referenceStateEntries: Accessor<ReferenceStateEntries>;

	protected stateByReference: Accessor<ReferenceStateMap>;

	readonly instanceState: Accessor<Element>;
	readonly serializedInstanceState: Accessor<string>;

	constructor(readonly form: XFormDefinition) {
		const { root } = form.model;

		this.definition = root;

		const { nodeset } = root.bind;
		const reference = `/${root.nodeName}`;

		if (nodeset !== reference) {
			throw new Error('Unexpected bind nodeset for root node');
		}

		this.nodeset = nodeset;
		this.reference = reference;

		const instanceDOM = form.xformDOM.createInstance();

		this.instanceDOM = instanceDOM;
		this.xformDocument = instanceDOM.xformDocument;
		this.node = instanceDOM.primaryInstanceRoot;
		this.node.replaceChildren();

		const evaluator = instanceDOM.primaryInstanceEvaluator;

		this.evaluator = evaluator;
		this.translations = TranslationState.from(this);
		this.children = buildChildStates(this, this);

		this.initializeState();

		const referenceStateEntries = this.createReferenceStateEntries(this);

		this.referenceStateEntries = referenceStateEntries;
		this.stateByReference = createMemo(() => new Map(referenceStateEntries()));
		this.instanceState = this.createInstanceState();
		this.serializedInstanceState = this.createSerializedInstanceState();
	}

	/**
	 * Sorts a set or subset of descendants based on the topological order
	 * already performed in {@link ModelBindMap}
	 */
	protected sortDescendants(
		descendants: readonly AnyDescendantNodeState[]
	): readonly AnyDescendantNodeState[] {
		const { sortedNodesetIndexes } = this.form;

		return descendants.slice().sort((a, b) => {
			const aIndex = sortedNodesetIndexes?.get(a.nodeset) ?? -1;
			const bIndex = sortedNodesetIndexes?.get(b.nodeset) ?? -1;

			return aIndex - bIndex;
		});
	}

	protected collectUninitializedDescendants(
		parent: AnyNodeState
	): readonly AnyDescendantNodeState[] {
		let children: readonly AnyDescendantNodeState[];

		if (parent.type === 'repeat-sequence') {
			children = parent.getInstances();
		} else {
			children = parent.children ?? [];
		}

		const descendants = children.flatMap((child) => {
			return this.collectUninitializedDescendants(child);
		});

		if (parent.isStateInitialized || parent.type === 'root') {
			return descendants;
		}

		return [parent, ...descendants];
	}

	getUninitializedDescendants(parent: AnyNodeState): readonly AnyDescendantNodeState[] {
		const descendants = this.collectUninitializedDescendants(parent);

		return this.sortDescendants(descendants);
	}

	isStateInitialized = false;

	initializeState(): void {
		if (this.isStateInitialized) {
			return;
		}

		const descendants = this.getUninitializedDescendants(this);
		const stateByReference = new Map<string, AnyNodeState>([
			[this.reference, this],
			...descendants.map((descendant) => {
				return [descendant.reference, descendant] as const;
			}),
		]);

		this.stateByReference = () => stateByReference;

		for (const descendant of descendants) {
			descendant.initializeState();
			stateByReference.set(descendant.reference, descendant);
		}

		this.isStateInitialized = true;
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

					case 'subtree': {
						const subtreeEntries = this.createReferenceStateEntries(child);

						return subtreeEntries();
					}

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
		const indent = (str: string, depth: number) => {
			const prefix = ' '.repeat(depth * 2);

			return `${prefix}${str}`;
		};

		const serializeAttribute = (attribute: Attr): string => {
			return `${attribute.name}="${attribute.value.replaceAll('"', '&quot;')}"`;
		};
		const serializeElement = (element: Element, depth = 0): string => {
			const { attributes, children, tagName, textContent } = element;

			let openTag: string;

			const closeTag = `</${tagName}>`;

			if (attributes.length === 0) {
				openTag = `<${tagName}>`;
			} else {
				const serializedAttributes = Array.from(attributes).map(serializeAttribute);

				openTag = `<${tagName} ${serializedAttributes.join(' ')}>`;
			}

			if (children.length === 0) {
				if (textContent === '') {
					return indent(openTag.replace(/>$/, '/>'), depth);
				}

				return indent(`${openTag}${textContent}${closeTag}`, depth);
			}

			return [
				indent(openTag, depth),
				...Array.from(children).map((child) => {
					return serializeElement(child, depth + 1);
				}),
				indent(closeTag, depth),
			].join('\n');
		};

		return () => {
			const instance = this.instanceState();

			return serializeElement(instance);
		};
	}

	getState(reference: string): AnyNodeState | null {
		return this.stateByReference().get(reference) ?? null;
	}

	toJSON() {
		return {};
	}
}
