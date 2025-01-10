import type {
	AnySelectDefinition,
	SelectType,
} from '../parse/body/control/select/SelectDefinition.ts';
import type { LeafNodeDefinition } from '../parse/model/LeafNodeDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { NodeAppearances } from './NodeAppearances.ts';
import type { RootNode } from './RootNode.ts';
import type { TextRange } from './TextRange.ts';
import type { GeneralParentNode } from './hierarchy.ts';
import type { LeafNodeValidationState } from './validation.ts';

export interface SelectItem {
	get value(): string;
	get label(): TextRange<'item-label'>;
}

export interface SelectNodeState extends BaseNodeState {
	get children(): null;

	/**
	 * @todo should {@link BaseNodeState} include this??
	 */
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
	get value(): readonly SelectItem[];
}

export interface SelectDefinition extends LeafNodeDefinition {
	readonly bodyElement: AnySelectDefinition;
}

export type SelectNodeAppearances = NodeAppearances<SelectDefinition>;

export interface SelectNode extends BaseNode {
	readonly nodeType: 'select';
	readonly selectType: SelectType;
	readonly appearances: SelectNodeAppearances;
	readonly definition: SelectDefinition;
	readonly root: RootNode;
	readonly parent: GeneralParentNode;
	readonly currentState: SelectNodeState;
	readonly validationState: LeafNodeValidationState;

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
	selectValues(values: Iterable<string>): RootNode;
}
