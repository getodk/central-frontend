import type { RuntimeValue } from '../lib/codecs/getSharedValueCodec.ts';
import type {
	AnySelectControlDefinition,
	SelectType,
} from '../parse/body/control/SelectControlDefinition.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { BaseValueNode, BaseValueNodeState } from './BaseValueNode.ts';
import type { NodeAppearances } from './NodeAppearances.ts';
import type { RootNode } from './RootNode.ts';
import type { TextRange } from './TextRange.ts';
import type { ValueType } from './ValueType.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { LeafNodeValidationState } from './validation.ts';

export type SelectItemValue<V extends ValueType> = NonNullable<RuntimeValue<V>>;

export type SelectValues<V extends ValueType> = ReadonlyArray<SelectItemValue<V>>;

export interface SelectItem<V extends ValueType> {
	get label(): TextRange<'item-label'>;
	get value(): SelectItemValue<V>;

	/**
	 * Produces a string serialization of {@link value}, consistent with that
	 * value's serialization for submission purposes.
	 *
	 * Clients should use caution when using this serialized representation! It is
	 * generally applicable for cases where a string value **MUST** be used (e.g.
	 * for integration with platform and/or third party interfaces). Use of this
	 * value for reproducing aspects of submission or instance state piecemeal is
	 * **highly discouraged**.
	 */
	get asString(): string;
}

export type SelectValueOptions<V extends ValueType> = ReadonlyArray<SelectItem<V>>;

export interface SelectNodeState<V extends ValueType> extends BaseValueNodeState<SelectValues<V>> {
	get children(): null;

	get valueOptions(): SelectValueOptions<V>;

	/**
	 * This value is treated as set-like by the engine, where each
	 * {@link SelectItem.value | item's `value`} may occur once (at most), and:
	 *
	 * - Fields defined with an XForms `<select>` may contain multiple items
	 * - Fields defined with an XForms `<select1>` will always produce one item
	 *   (at most)
	 *
	 * @todo Maybe it makes more sense for the client interface to break these up!
	 * Should a `SelectNodeState` have this `value` type, whereas a hypothetical
	 * `Select1NodeState` would have `get value(): SelectItem | null`?
	 */
	get value(): SelectValues<V>;
}

export interface SelectDefinition<V extends ValueType = ValueType> extends LeafNodeDefinition<V> {
	readonly bodyElement: AnySelectControlDefinition;
}

export type SelectNodeAppearances = NodeAppearances<SelectDefinition>;

export interface SelectNode<V extends ValueType = ValueType>
	extends BaseValueNode<V, SelectValues<V>> {
	readonly nodeType: 'select';
	readonly valueType: V;
	readonly selectType: SelectType;
	readonly appearances: SelectNodeAppearances;
	readonly definition: SelectDefinition;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: SelectNodeState<V>;
	readonly validationState: LeafNodeValidationState;

	/**
	 * Convenience API to get the {@link SelectItem} which is associated with
	 * {@link value}, if one is currently available—i.e. if it is present in
	 * {@link SelectNodeState.valueOptions}.
	 */
	getValueOption<T extends ValueType>(
		this: SelectNode<T>,
		value: SelectItemValue<T>
	): SelectItem<T> | null;
	getValueOption(value: SelectItemValue<V>): SelectItem<V> | null;

	/**
	 * Convenience API to determine if {@link value} is currently selected—i.e. if
	 * it is one of the selected values in {@link SelectNodeState.value}.
	 */
	isSelected<T extends ValueType>(this: SelectNode<T>, value: SelectItemValue<T>): boolean;
	isSelected(value: SelectItemValue<V>): boolean;

	/**
	 * Selects a single {@link value}, as provided by a {@link SelectItem.value}.
	 * Calling this setter replaces the currently selected value(s, if any),
	 * where:
	 *
	 * - if the provided value is `null`, the current selection is cleared; ELSE
	 * - the provided value is selected in place of any currently selected values.
	 *
	 * This setter is most useful for {@link SelectNode}s associated with an
	 * XForms
	 * {@link https://getodk.github.io/xforms-spec/#body-elements | `<select1>`}
	 * control.
	 */
	selectValue<T extends ValueType>(this: SelectNode<T>, value: SelectItemValue<T> | null): RootNode;
	selectValue(this: SelectNode<V>, value: SelectItemValue<V> | null): RootNode;

	/**
	 * Selects any number of {@link values}, as provided by any number of
	 * {@link SelectItem.value}s. Calling this setter replaces the currently
	 * selected value(s, if any). If called with an empty array, the current
	 * selection is cleared.
	 *
	 * This setter is most useful for {@link SelectNode}s associated with an
	 * XForms
	 * {@link https://getodk.github.io/xforms-spec/#body-elements | `<select>`}
	 * control.
	 *
	 * This setter _may_ be used with a `<select1>` control, in which case the
	 * provided {@link values} should produce at most one value.
	 */
	selectValues<T extends ValueType>(this: SelectNode<T>, values: SelectValues<T>): RootNode;
	selectValues(this: SelectNode<V>, values: SelectValues<V>): RootNode;
}

export type StringSelectNode = SelectNode<'string'>;
export type IntSelectNode = SelectNode<'int'>;
export type DecimalSelectNode = SelectNode<'decimal'>;

// prettier-ignore
type SupportedSelectValueType =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| 'string'
	| 'int'
	| 'decimal';

type TemporaryStringValueType = Exclude<ValueType, SupportedSelectValueType>;

export type TemporaryStringValueSelectNode = {
	[V in TemporaryStringValueType]: SelectNode<V>;
}[TemporaryStringValueType];

// prettier-ignore
export type AnySelectNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| StringSelectNode
	| IntSelectNode
	| DecimalSelectNode
	| TemporaryStringValueSelectNode;
