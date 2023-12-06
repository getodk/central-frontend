import { xmlXPathWhitespaceSeparatedList } from '@odk/common/lib/string/whitespace.ts';
import { ReactiveSet } from '@solid-primitives/set';
import type { Accessor } from 'solid-js';
import { batch, createComputed, createMemo } from 'solid-js';
import type { AnySelectDefinition } from '../../body/control/select/SelectDefinition.ts';
import type { ValueNodeState } from '../ValueNodeState.ts';
import { SelectStateItem } from './SelectStateItem.ts';

export class SelectState {
	readonly items: Accessor<readonly SelectStateItem[]>;

	/**
	 * Stores all currently selected item values, as selected either by:
	 *
	 * - initial submission state (i.e. new entry with default values, presumably
	 *   editing a previous or incomplete submission)
	 * - user intervention (e.g. the user directly selects values in the view)
	 *
	 * This is in-memory state, which may (intentionally) diverge from the values
	 * available in {@link items}. The actual stored submission state is
	 * serialized from the intersection of values in this set, and values
	 * available in `items`. The intent/effect is to support the following example
	 * scenario:
	 *
	 * 1. Initially the items available are: A, B, C.
	 *
	 * 2. The user selects items A, B. Effective states:
	 *
	 *    - `items`:    A, B, C
	 *    - `selected`: A, B
	 *    - submission: A, B
	 *
	 * 3. The user performs an action causing the items to be filtered to: A, C.
	 *    Effective states:
	 *
	 *    - `items`:    A, C
	 *    - `selected`: A, B
	 *    - submission: A
	 *
	 * 4. The user performs an action reverting the previous filter, restoring the
	 *    item values to: A, B, C. Effective states:
	 *
	 *    - `items`:    A, B, C
	 *    - `selected`: A, B
	 *    - submission: A, B
	 *
	 * It's assumed that the above behavior is **at least** user-friendly, and
	 * quite likely expected.
	 *
	 * It is also assumed, but not yet implemented, that any user initiated
	 * selection change should discard `selected` values which have been
	 * subsequently filterered from `items`, i.e. in lieu of the above step 4:
	 *
	 * 4. The user adds C to the selection. Effective states:
	 *
	 *    - `items`: A, C
	 *    - `selected`: A, C  -- **not** A, B, C
	 *    - submission: A, C
	 *
	 * 5. The user performs an action reverting the previous filter, restoring
	 *    item values: A, B, C. Effective states:
	 *
	 *    - `items`: A, B, C
	 *    - `selected`: A, C  -- **not** A, B, C
	 *    - submission: A, C
	 */
	protected readonly selected: ReactiveSet<string>;

	constructor(state: ValueNodeState, select: AnySelectDefinition) {
		const items = this.createItems(state, select);
		const itemValues = createMemo(() => items().map((item) => item.value));
		const initialValue = xmlXPathWhitespaceSeparatedList(state.getValue(), {
			ignoreEmpty: true,
		});
		const selected = new ReactiveSet<string>(initialValue);

		this.items = items;
		this.selected = selected;

		const serializedValue = createMemo(() => {
			return itemValues()
				.filter((itemValue) => selected.has(itemValue))
				.join(' ');
		});

		createComputed(() => {
			state.setValue(serializedValue());
		});
	}

	protected createItems(
		state: ValueNodeState,
		select: AnySelectDefinition
	): Accessor<readonly SelectStateItem[]> {
		const { itemset } = select;

		if (itemset == null) {
			const stateItems = select.items.map((item) => {
				return new SelectStateItem(state, item.value, item.label);
			});

			return () => stateItems;
		} else {
			const itemNodes = state.createNodesetEvaluation(itemset.nodes);

			return createMemo(() => {
				return itemNodes().map((contextNode) => {
					const itemOptions = { contextNode };
					const value = state.entry.evaluator.evaluateString(itemset.value.expression, itemOptions);
					const { label } = itemset;

					return new SelectStateItem(state, value, label, itemOptions);
				});
			});
		}
	}

	isSelected(item: SelectStateItem): boolean {
		return this.selected.has(item.value);
	}

	select(item: SelectStateItem): void {
		this.selected.add(item.value);
	}

	deselect(item: SelectStateItem): void {
		this.selected.delete(item.value);
	}

	setValue(value: string): void {
		batch(() => {
			const { selected } = this;

			selected.clear();
			selected.add(value);
		});
	}
}
