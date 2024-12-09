import type { RuntimeInputValue, RuntimeValue } from '../lib/codecs/getSharedValueCodec.ts';
import type { InputControlDefinition } from '../parse/body/control/InputControlDefinition.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { BaseValueNode, BaseValueNodeState } from './BaseValueNode.ts';
import type { NodeAppearances } from './NodeAppearances.ts';
import type { RootNode } from './RootNode.ts';
import type { ValueType } from './ValueType.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { LeafNodeValidationState } from './validation.ts';

export type InputValue<V extends ValueType> = RuntimeValue<V>;

export type InputNodeInputValue<V extends ValueType> = RuntimeInputValue<V>;

export interface InputNodeState<V extends ValueType> extends BaseValueNodeState<InputValue<V>> {
	get children(): null;
	get valueOptions(): null;

	/**
	 * Reflects the current value of a {@link InputNode}. This value may be
	 * populated when a form is loaded, and it may be updated by certain
	 * computations defined by the form. It may also be updated by a client, using
	 * the {@link InputNode.setValue} method.
	 */
	get value(): InputValue<V>;
}

export interface InputDefinition<V extends ValueType = ValueType> extends LeafNodeDefinition<V> {
	readonly bodyElement: InputControlDefinition;
}

export type InputNodeAppearances = NodeAppearances<InputDefinition>;

/**
 * A node corresponding to form field defined as an
 * {@link https://getodk.github.io/xforms-spec/#body-elements | XForms `<input>`},
 * which a user-facing client would likely present for a user to fill..
 */
export interface InputNode<V extends ValueType = ValueType>
	extends BaseValueNode<V, InputValue<V>> {
	readonly nodeType: 'input';
	readonly valueType: V;
	readonly appearances: InputNodeAppearances;
	readonly definition: InputDefinition<V>;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: InputNodeState<V>;
	readonly validationState: LeafNodeValidationState;

	/**
	 * For use by a client to update the value of an {@link InputNode}.
	 */
	setValue(value: InputNodeInputValue<V>): RootNode;
}

export type StringInputNode = InputNode<'string'>;
export type IntInputNode = InputNode<'int'>;
export type DecimalInputNode = InputNode<'decimal'>;

// prettier-ignore
type SupportedInputValueType =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'string'
	| 'int'
	| 'decimal';

type TemporaryStringValueType = Exclude<ValueType, SupportedInputValueType>;

export type TemporaryStringValueInputNode = InputNode<TemporaryStringValueType>;

// prettier-ignore
export type AnyInputNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| StringInputNode
	| IntInputNode
	| DecimalInputNode
	| TemporaryStringValueInputNode;
