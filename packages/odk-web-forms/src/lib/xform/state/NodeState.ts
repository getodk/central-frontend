import type { Accessor, Signal } from 'solid-js';
import type {
	NodeDefinition,
	NodeDefinitionType,
	TypedNodeDefinition,
} from '../model/NodeDefinition.ts';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- referenced in JSDoc
import type { BindDefinition } from '../model/BindDefinition.ts';
import type { RepeatInstanceDefinition } from '../model/RepeatInstanceDefinition.ts';
import type { RepeatTemplateDefinition } from '../model/RepeatTemplateDefinition.ts';
import type { EntryState } from './EntryState.ts';
import type { RepeatInstanceState } from './RepeatInstanceState.ts';
import type { RepeatSequenceAnchorComment, RepeatSequenceState } from './RepeatSequenceState.ts';
import type { SubtreeState } from './SubtreeState.ts';
import type { ValueNodeState } from './ValueNodeState.ts';

export type NodeStateType = Exclude<NodeDefinitionType, 'repeat-template'>;

// prettier-ignore
export type AnyNodeState =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| EntryState
	| RepeatSequenceState
	| RepeatInstanceState
	| SubtreeState
	| ValueNodeState;

type ParentStateType = Exclude<NodeStateType, 'repeat-sequence' | 'value-node'>;

export type AnyParentState = Extract<AnyNodeState, { readonly type: ParentStateType }>;

type ChildStateType = Exclude<NodeStateType, 'repeat-instance' | 'root'>;

export type AnyChildState = Extract<AnyNodeState, { readonly type: ChildStateType }>;

export type AnyChildStates = readonly AnyChildState[];

// prettier-ignore
export type ChildStates<Type extends NodeStateType> =
	Type extends ParentStateType
		? readonly AnyChildState[]
		: null;

// prettier-ignore
export type ParentState<Type extends NodeStateType> =
	Type extends 'repeat-instance'
		? RepeatSequenceState
	: Type extends ChildStateType
		? AnyParentState
		: null;

// prettier-ignore
export type ValueSignal<Type extends NodeStateType> =
	Type extends 'value-node'
		? Signal<string>
		: null;

// prettier-ignore
export type StateNode<Type extends NodeStateType> =
	Type extends 'repeat-sequence'
		? RepeatSequenceAnchorComment
		: Element;

// prettier-ignore
export type RepeatModelDefinition =
	| RepeatInstanceDefinition
	| RepeatTemplateDefinition;

// prettier-ignore
type StateModelDefinitionType<Type extends NodeStateType> =
	Type extends 'repeat-instance'
		? 'repeat-instance' | 'repeat-template'
		: Type;

// prettier-ignore
export type StateModelDefinition<Type extends NodeStateType> =
	& NodeDefinition<StateModelDefinitionType<Type>>
	& (
			Type extends 'repeat-instance'
				? RepeatModelDefinition
				: TypedNodeDefinition<Type>
		);

export interface NodeState<Type extends NodeStateType> {
	readonly type: Type;
	readonly definition: StateModelDefinition<Type>;

	/**
	 * The static, unindexed nodeset reference to all nodes for the same
	 * {@link BindDefinition}. This is a convenience property, derived directly
	 * from the model {@link definition}.
	 */
	readonly nodeset: string;

	/**
	 * A reference to the node's {@link nodeset} which may be indexed (for repeat
	 * instances and their descendants). This is a unique runtime reference to the
	 * node's state which:
	 *
	 * - will be reactively updated whenever its index (or that of its repeat
	 *   ancestors) changes.
	 * - is a valid XPath expression resolving to its DOM {@link node} (when
	 *   evaluated from {@link entry.evaluator})
	 * - being unique, is suitable for use elsewhere when unique references are
	 *   appropriate (e.g. as a map key for dependency loookup, as an HTML `id`
	 *   and/or `<input name>`, `<label for>` and so on).
	 *
	 * It is called out as a getter here specifically to indicate that it is
	 * expected to be computed by {@link NodeState} implementations. Where the
	 * computed value is not **known** to be static, implementations MUST ensure
	 * that it is reactive to its dynamic dependencies (i.e. repeat instance
	 * indexes). It is **not** typed as an {@link Accessor} to allow flexibility
	 * for implementations to satisfy the interface.
	 */
	get reference(): string;

	readonly isReferenceStatic: boolean;

	readonly entry: EntryState;

	// TODO: there is currently a fair bit of API awkwardness around repeats'
	// usage of `parent` and `children`:
	//
	// - repeat instances are **not** `children` of their sequence (semantically
	//   correct, as repeat sequences have no model hierarachy at all), yet...
	// - sequences **are** the `parent` of each instance (which seems conceptually
	//   correct from an "ownership" perspective).
	//
	// In both cases, besides being somewhat a semantic mishmash, it's also a
	// source of some annoying branchy special case logic. In some ways this feels
	// like a good thing (repeats _are_ a special case and _do_ warrant extra
	// consideration), but in other ways it makes certain logic seem more complicated
	// than it needs to be (e.g. it would be trivial to build any flattened or
	// derived structure from the state tree if these special cases didn't exist).
	readonly parent: ParentState<Type>;

	readonly children: ChildStates<Type>;

	/**
	 * The actual DOM node represented by a {@link NodeState} implementation
	 * instance. This node MUST be resolvable by the computed XPath
	 * {@link reference}, e.g. by calling:
	 *
	 * ```ts
	 * nodeState.entry.evaluator.evaluateNode(nodeState.reference);
	 * ```
	 */
	readonly node: StateNode<Type>;

	/**
	 * Per ODK XForms spec:
	 *
	 * > As in
	 * > {@link https://www.w3.org/TR/2003/REC-xforms-20031014/slice6.html#model-prop-readOnly | XForms 1.0}
	 * > [...]
	 *
	 * While the ODK spec is not explicit about inheritance, according to the
	 * linked W3C XForms spec:
	 *
	 * > If any ancestor node evaluates to true, this value is treated as true.
	 * > Otherwise, the local value is used.
	 */
	readonly isReadonly: Accessor<boolean>;

	/**
	 * Per ODK XForms spec:
	 *
	 * > As in
	 * > {@link https://www.w3.org/TR/2003/REC-xforms-20031014/slice6.html#model-prop-relevant | XForms 1.0}
	 * > [...]
	 *
	 * Which states:
	 *
	 * > If any ancestor node evaluates to XPath false, this value is treated as
	 * > false. Otherwise, the local value is used.
	 */
	readonly isRelevant: Accessor<boolean>;

	/**
	 * Consistent with ODK and W3C XForms specifications; as such, it is not
	 * inherited. TODO: what does it mean for a group to be required if none of
	 * its descendants are?
	 */
	readonly isRequired: Accessor<boolean>;

	readonly valueState: ValueSignal<Type>;

	get isStateInitialized(): boolean;
	initializeState(): void;
}
