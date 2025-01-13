import { UpsertableMap } from '@getodk/common/lib/collections/UpsertableMap.ts';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { ActiveLanguage } from '../../client/FormLanguage.ts';
import type { SelectItem, SelectValueOptions } from '../../client/SelectNode.ts';
import type { TextRange as ClientTextRange } from '../../client/TextRange.ts';
import type { ValueType } from '../../client/ValueType.ts';
import type { EvaluationContext } from '../../instance/internal-api/EvaluationContext.ts';
import type { TranslationContext } from '../../instance/internal-api/TranslationContext.ts';
import type { SelectControl } from '../../instance/SelectControl.ts';
import { TextChunk } from '../../instance/text/TextChunk.ts';
import { TextRange } from '../../instance/text/TextRange.ts';
import type { EngineXPathNode } from '../../integration/xpath/adapter/kind.ts';
import type { EngineXPathEvaluator } from '../../integration/xpath/EngineXPathEvaluator.ts';
import type { ItemDefinition } from '../../parse/body/control/select/ItemDefinition.ts';
import type { ItemsetDefinition } from '../../parse/body/control/select/ItemsetDefinition.ts';
import type { SelectCodec } from '../codecs/select/getSelectCodec.ts';
import { createComputedExpression } from './createComputedExpression.ts';
import type { ReactiveScope } from './scope.ts';
import { createTextRange } from './text/createTextRange.ts';

type DerivedItemLabel = ClientTextRange<'item-label', 'form-derived'>;

const derivedItemLabel = (context: TranslationContext, value: string): DerivedItemLabel => {
	const chunk = new TextChunk(context, 'literal', value);

	return new TextRange('form-derived', 'item-label', [chunk]);
};

const createSelectItemLabel = (
	context: EvaluationContext,
	definition: ItemDefinition
): Accessor<ClientTextRange<'item-label'>> => {
	const { label, value } = definition;

	if (label == null) {
		return () => derivedItemLabel(context, value);
	}

	return createTextRange(context, 'item-label', label);
};

interface SourceValueSelectItem {
	readonly value: string;
	readonly label: ClientTextRange<'item-label'>;
}

const createTranslatedStaticSelectItems = <V extends ValueType>(
	select: SelectControl<V>,
	items: readonly ItemDefinition[]
): Accessor<readonly SourceValueSelectItem[]> => {
	return select.scope.runTask(() => {
		const labeledItems = items.map((item) => {
			const { value } = item;
			const label = createSelectItemLabel(select, item);

			return () => ({
				value,
				label: label(),
			});
		});

		return createMemo(() => {
			return labeledItems.map((item) => item());
		});
	});
};

class ItemsetItemEvaluationContext<V extends ValueType> implements EvaluationContext {
	readonly isAttached: Accessor<boolean>;
	readonly scope: ReactiveScope;
	readonly evaluator: EngineXPathEvaluator;
	readonly contextReference: Accessor<string>;
	readonly getActiveLanguage: Accessor<ActiveLanguage>;

	constructor(
		select: SelectControl<V>,
		readonly contextNode: EngineXPathNode
	) {
		this.isAttached = select.isAttached;
		this.scope = select.scope;
		this.evaluator = select.evaluator;
		this.contextReference = select.contextReference;
		this.getActiveLanguage = select.getActiveLanguage;
	}
}

const createSelectItemsetItemLabel = (
	context: EvaluationContext,
	definition: ItemsetDefinition,
	itemValue: Accessor<string>
): Accessor<ClientTextRange<'item-label'>> => {
	const { label } = definition;

	if (label == null) {
		return createMemo(() => {
			return derivedItemLabel(context, itemValue());
		});
	}

	return createTextRange(context, 'item-label', label);
};

interface ItemsetItem {
	label(): ClientTextRange<'item-label'>;
	value(): string;
}

const createItemsetItems = <V extends ValueType>(
	select: SelectControl<V>,
	itemset: ItemsetDefinition
): Accessor<readonly ItemsetItem[]> => {
	return select.scope.runTask(() => {
		const itemNodes = createComputedExpression(select, itemset.nodes, {
			defaultValue: [],
		});
		const itemsCache = new UpsertableMap<EngineXPathNode, ItemsetItem>();

		return createMemo(() => {
			return itemNodes().map((itemNode) => {
				return itemsCache.upsert(itemNode, () => {
					const context = new ItemsetItemEvaluationContext(select, itemNode);
					const value = createComputedExpression(context, itemset.value, {
						defaultValue: '',
					});
					const label = createSelectItemsetItemLabel(context, itemset, value);

					return {
						label,
						value,
					};
				});
			});
		});
	});
};

const createItemset = <V extends ValueType>(
	select: SelectControl<V>,
	itemset: ItemsetDefinition
): Accessor<readonly SourceValueSelectItem[]> => {
	return select.scope.runTask(() => {
		const itemsetItems = createItemsetItems(select, itemset);

		return createMemo(() => {
			return itemsetItems().map((item) => {
				return {
					label: item.label(),
					value: item.value(),
				};
			});
		});
	});
};

/**
 * Creates a reactive computation of a {@link SelectControl}'s
 * {@link SelectItem}s, in support of the field's `valueOptions`.
 *
 * - Selects defined with static `<item>`s will compute to an corresponding
 *   static list of items.
 * - Selects defined with a computed `<itemset>` will compute to a reactive list
 *   of items.
 * - Items of both will produce {@link SelectItem.label | labels} reactive to
 *   their appropriate dependencies (whether relative to the itemset item node,
 *   referencing a form's `itext` translations, etc).
 */
export const createSelectItems = <V extends ValueType>(
	select: SelectControl<V>,
	codec: SelectCodec<V>
): Accessor<SelectValueOptions<V>> => {
	const { items, itemset } = select.definition.bodyElement;

	let getSourceValueItems: Accessor<readonly SourceValueSelectItem[]>;

	if (itemset != null) {
		getSourceValueItems = createItemset(select, itemset);
	} else {
		getSourceValueItems = createTranslatedStaticSelectItems(select, items);
	}

	return select.scope.runTask(() => {
		return createMemo(() => {
			return getSourceValueItems().map((item): SelectItem<V> => {
				const asString = item.value;

				return {
					value: codec.decodeItemValue(asString),
					label: item.label,
					asString,
				};
			});
		});
	});
};
