import type { RuntimeValue } from '../lib/codecs/getSharedValueCodec.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { BaseValueNode, BaseValueNodeState } from './BaseValueNode.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { RootNode } from './RootNode.ts';
import type { LeafNodeValidationState } from './validation.ts';
import type { ValueType } from './ValueType.ts';

export type ModelValue<V extends ValueType> = RuntimeValue<V>;

export interface ModelValueNodeState<V extends ValueType>
	extends BaseValueNodeState<ModelValue<V>> {
	get label(): null;
	get hint(): null;
	get children(): null;
	get valueOptions(): null;

	/**
	 * Reflects the current value of a {@link ModelValueNode}. This value may be
	 * populated when a form is loaded, and it may be updated by certain
	 * computations defined by the form.
	 */
	get value(): ModelValue<V>;
}

export interface ModelValueDefinition<V extends ValueType = ValueType>
	extends LeafNodeDefinition<V> {
	readonly bodyElement: null;
}

/**
 * A node which is:
 *
 * - model-only (i.e. it has no corresponding body element)
 * - a leaf/value node (i.e. it has no element children; it may be defined in
 *   the form's `<model>` as either an {@link Element} or {@link Attr})
 */
export interface ModelValueNode<V extends ValueType = ValueType>
	extends BaseValueNode<V, ModelValue<V>> {
	readonly nodeType: 'model-value';
	readonly valueType: V;
	readonly appearances: null;
	readonly nodeOptions: null;
	readonly definition: ModelValueDefinition<V>;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: ModelValueNodeState<V>;
	readonly validationState: LeafNodeValidationState;
}

export type AnyModelValueNode =
	| ModelValueNode<'barcode'>
	| ModelValueNode<'binary'>
	| ModelValueNode<'boolean'>
	| ModelValueNode<'date'>
	| ModelValueNode<'dateTime'>
	| ModelValueNode<'decimal'>
	| ModelValueNode<'geopoint'>
	| ModelValueNode<'geoshape'>
	| ModelValueNode<'geotrace'>
	| ModelValueNode<'int'>
	| ModelValueNode<'intent'>
	| ModelValueNode<'string'>
	| ModelValueNode<'time'>;
