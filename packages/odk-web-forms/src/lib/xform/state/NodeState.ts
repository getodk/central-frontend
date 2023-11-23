import type { Accessor, Signal } from 'solid-js';
import type {
	NodeDefinition,
	NodeDefinitionType,
	TypedNodeDefinition,
} from '../model/NodeDefinition.ts';
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
	 * XPath reference to a given node state's node, which may be a computed (and
	 * reactive) for repeat instances and their descendants.
	 */
	get reference(): string;

	readonly entry: EntryState;
	readonly parent: ParentState<Type>;
	readonly children: ChildStates<Type>;

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
}
