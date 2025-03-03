import type { RuntimeInputValue, RuntimeValue } from '../lib/codecs/getSharedValueCodec.ts';
import type { RangeNodeDefinition, RangeValueType } from '../parse/model/RangeNodeDefinition.ts';
import type { BaseValueNode, BaseValueNodeState } from './BaseValueNode.ts';
import type { NodeAppearances } from './NodeAppearances.ts';
import type { RootNode } from './RootNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { LeafNodeValidationState } from './validation.ts';

export type { RangeValueType };

export type RangeValue<V extends RangeValueType> = RuntimeValue<V>;

export type RangeInputValue<V extends RangeValueType> = RuntimeInputValue<V>;

export interface RangeNodeState<V extends RangeValueType>
	extends BaseValueNodeState<RangeValue<V>> {
	get valueOptions(): null;
}

export type RangeNodeAppearances = NodeAppearances<RangeNodeDefinition>;

/**
 * A node corresponding to form field defined as an
 * {@link https://getodk.github.io/xforms-spec/#body-elements | XForms `<range>`}.
 */
export interface RangeNode<V extends RangeValueType = RangeValueType>
	extends BaseValueNode<V, RangeValue<V>> {
	readonly nodeType: 'range';
	readonly valueType: V;
	readonly appearances: RangeNodeAppearances;
	readonly nodeOptions: null;
	readonly definition: RangeNodeDefinition<V>;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: RangeNodeState<V>;
	readonly validationState: LeafNodeValidationState;

	/**
	 * For use by a client to update the value of an {@link RangeNode}.
	 */
	setValue(value: RangeInputValue<V>): RootNode;
}

export type IntRangeNode = RangeNode<'int'>;
export type DecimalRangeNode = RangeNode<'decimal'>;

// prettier-ignore
export type AnyRangeNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| IntRangeNode
	| DecimalRangeNode;
