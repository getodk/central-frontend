import { UpsertableMap } from '@getodk/common/lib/collections/UpsertableMap.ts';
import type { XFormsXPathEvaluator } from '@getodk/xpath';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { ItemDefinition } from '../../body/control/select/ItemDefinition.ts';
import type { ItemsetDefinition } from '../../body/control/select/ItemsetDefinition.ts';
import type { TextRange as ClientTextRange } from '../../client/TextRange.ts';
import type { SelectItem } from '../../index.ts';
import type { SelectField } from '../../instance/SelectField.ts';
import type {
	EvaluationContext,
	EvaluationContextRoot,
} from '../../instance/internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from '../../instance/internal-api/SubscribableDependency.ts';
import { TextChunk } from '../../instance/text/TextChunk.ts';
import { TextRange } from '../../instance/text/TextRange.ts';
import { createComputedExpression } from './createComputedExpression.ts';
import type { ReactiveScope } from './scope.ts';
import { createTextRange } from './text/createTextRange.ts';

type DerivedItemLabel = ClientTextRange<'item-label', 'form-derived'>;

const derivedItemLabel = (context: EvaluationContext, value: string): DerivedItemLabel => {
	const chunk = new TextChunk(context.root, 'static', value);

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

const createTranslatedStaticSelectItems = (
	selectField: SelectField,
	items: readonly ItemDefinition[]
): Accessor<readonly SelectItem[]> => {
	return selectField.scope.runTask(() => {
		const labeledItems = items.map((item) => {
			const { value } = item;
			const label = createSelectItemLabel(selectField, item);

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
	readonly scope: ReactiveScope;
	readonly evaluator: XFormsXPathEvaluator;
	readonly root: EvaluationContextRoot;
	readonly contextReference: Accessor<string>;

	constructor(
		private readonly selectField: SelectField,
		readonly contextNode: Node
	) {
		this.scope = selectField.scope;
		this.evaluator = selectField.evaluator;
		this.root = selectField.root;
		this.contextReference = selectField.contextReference;
	}

	getSubscribableDependenciesByReference(reference: string): readonly SubscribableDependency[] {
		return this.selectField.getSubscribableDependenciesByReference(reference);
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

const createItemsetItems = (
	selectField: SelectField,
	itemset: ItemsetDefinition
): Accessor<readonly ItemsetItem[]> => {
	return selectField.scope.runTask(() => {
		const itemNodes = createComputedExpression(selectField, itemset.nodes);
		const itemsCache = new UpsertableMap<Node, ItemsetItem>();

		return createMemo(() => {
			return itemNodes().map((itemNode) => {
				return itemsCache.upsert(itemNode, () => {
					const context = new ItemsetItemEvaluationContext(selectField, itemNode);
					const value = createComputedExpression(context, itemset.value);
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

const createItemset = (
	selectField: SelectField,
	itemset: ItemsetDefinition
): Accessor<readonly SelectItem[]> => {
	return selectField.scope.runTask(() => {
		const itemsetItems = createItemsetItems(selectField, itemset);

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
 * Creates a reactive computation of a {@link SelectField}'s
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
export const createSelectItems = (selectField: SelectField): Accessor<readonly SelectItem[]> => {
	const { items, itemset } = selectField.definition.bodyElement;

	if (itemset == null) {
		return createTranslatedStaticSelectItems(selectField, items);
	}

	return createItemset(selectField, itemset);
};
