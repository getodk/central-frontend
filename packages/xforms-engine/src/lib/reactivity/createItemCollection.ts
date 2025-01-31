import { UpsertableMap } from '@getodk/common/lib/collections/UpsertableMap.ts';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { ActiveLanguage } from '../../client/FormLanguage.ts';
import type { SelectItem } from '../../client/SelectNode.ts';
import type { RankItem } from '../../client/RankNode.ts';
import type { TextRange as ClientTextRange } from '../../client/TextRange.ts';
import type { EvaluationContext } from '../../instance/internal-api/EvaluationContext.ts';
import type { TranslationContext } from '../../instance/internal-api/TranslationContext.ts';
import type { SelectControl } from '../../instance/SelectControl.ts';
import type { RankControl } from '../../instance/RankControl.ts';
import { TextChunk } from '../../instance/text/TextChunk.ts';
import { TextRange } from '../../instance/text/TextRange.ts';
import type { EngineXPathNode } from '../../integration/xpath/adapter/kind.ts';
import type { EngineXPathEvaluator } from '../../integration/xpath/EngineXPathEvaluator.ts';
import type { ItemDefinition } from '../../parse/body/control/ItemDefinition.ts';
import type { ItemsetDefinition } from '../../parse/body/control/ItemsetDefinition.ts';
import { createComputedExpression } from './createComputedExpression.ts';
import type { ReactiveScope } from './scope.ts';
import { createTextRange } from './text/createTextRange.ts';

export type ItemCollectionControl = RankControl | SelectControl;
type Item = RankItem | SelectItem;
type DerivedItemLabel = ClientTextRange<'item-label', 'form-derived'>;

const derivedItemLabel = (context: TranslationContext, value: string): DerivedItemLabel => {
	const chunk = new TextChunk(context, 'literal', value);

	return new TextRange('form-derived', 'item-label', [chunk]);
};

const createItemLabel = (
	context: EvaluationContext,
	definition: ItemDefinition
): Accessor<ClientTextRange<'item-label'>> => {
	const { label, value } = definition;

	if (label == null) {
		return () => derivedItemLabel(context, value);
	}

	return createTextRange(context, 'item-label', label);
};

const createTranslatedStaticItems = (
	control: ItemCollectionControl,
	items: readonly ItemDefinition[]
): Accessor<readonly Item[]> => {
	return control.scope.runTask(() => {
		const labeledItems = items.map((item) => {
			const { value } = item;
			const label = createItemLabel(control, item);

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

class ItemsetItemEvaluationContext implements EvaluationContext {
	readonly isAttached: Accessor<boolean>;
	readonly scope: ReactiveScope;
	readonly evaluator: EngineXPathEvaluator;
	readonly contextReference: Accessor<string>;
	readonly getActiveLanguage: Accessor<ActiveLanguage>;

	constructor(
		control: ItemCollectionControl,
		readonly contextNode: EngineXPathNode
	) {
		this.isAttached = control.isAttached;
		this.scope = control.scope;
		this.evaluator = control.evaluator;
		this.contextReference = control.contextReference;
		this.getActiveLanguage = control.getActiveLanguage;
	}
}

const createItemsetItemLabel = (
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

const createItemsetItems = (
	control: ItemCollectionControl,
	itemset: ItemsetDefinition
): Accessor<readonly ItemsetItem[]> => {
	return control.scope.runTask(() => {
		const itemNodes = createComputedExpression(control, itemset.nodes, {
			defaultValue: [],
		});
		const itemsCache = new UpsertableMap<EngineXPathNode, ItemsetItem>();

		return createMemo(() => {
			return itemNodes().map((itemNode) => {
				return itemsCache.upsert(itemNode, () => {
					const context = new ItemsetItemEvaluationContext(control, itemNode);
					const value = createComputedExpression(context, itemset.value, {
						defaultValue: '',
					});
					const label = createItemsetItemLabel(context, itemset, value);

					return {
						label,
						value,
					};
				});
			});
		});
	});
};

const createItemset = (
	control: ItemCollectionControl,
	itemset: ItemsetDefinition
): Accessor<readonly Item[]> => {
	return control.scope.runTask(() => {
		const itemsetItems = createItemsetItems(control, itemset);

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
 * Creates a reactive computation of a {@link ItemCollectionControl}'s
 * {@link Item}s, in support of the field's `valueOptions`.
 *
 * - The control defined with static `<item>`s will compute to an corresponding
 *   static list of items.
 * - The control defined with a computed `<itemset>` will compute to a reactive list
 *   of items.
 * - Items of both will produce {@link ItemType.label | labels} reactive to
 *   their appropriate dependencies (whether relative to the itemset item node,
 *   referencing a form's `itext` translations, etc).
 */
export const createItemCollection = (control: ItemCollectionControl): Accessor<readonly Item[]> => {
	const { items, itemset } = control.definition.bodyElement;

	if (itemset != null) {
		return createItemset(control, itemset);
	}

	return createTranslatedStaticItems(control, items);
};
