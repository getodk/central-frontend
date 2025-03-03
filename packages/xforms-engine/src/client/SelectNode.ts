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

export interface SelectItem {
	get label(): TextRange<'item-label'>;
	get value(): string;
}

export type SelectValueOptions = readonly SelectItem[];

export interface SelectNodeState extends BaseValueNodeState<readonly string[]> {
	get children(): null;

	get valueOptions(): readonly SelectItem[];

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
	get value(): readonly string[];
}

export interface SelectDefinition<V extends ValueType = ValueType> extends LeafNodeDefinition<V> {
	readonly bodyElement: AnySelectControlDefinition;
}

export type SelectNodeAppearances = NodeAppearances<SelectDefinition>;

export interface SelectNode extends BaseValueNode<'string', readonly string[]> {
	readonly nodeType: 'select';
	readonly valueType: 'string';
	readonly selectType: SelectType;
	readonly appearances: SelectNodeAppearances;
	readonly nodeOptions: null;
	readonly definition: SelectDefinition<'string'>;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: SelectNodeState;
	readonly validationState: LeafNodeValidationState;

	/**
	 * Convenience API to get the {@link SelectItem} which is associated with
	 * {@link value}, if one is currently available—i.e. if it is present in
	 * {@link SelectNodeState.valueOptions}.
	 */
	getValueOption(value: string): SelectItem | null;

	/**
	 * Convenience API to determine if {@link value} is currently selected—i.e. if
	 * it is one of the selected values in {@link SelectNodeState.value}.
	 */
	isSelected(value: string): boolean;

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
	selectValue(value: string | null): RootNode;

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
	selectValues(values: readonly string[]): RootNode;
}
