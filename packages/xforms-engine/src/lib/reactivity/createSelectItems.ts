import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { ItemDefinition } from '../../body/control/select/ItemDefinition.ts';
import type { ItemsetDefinition } from '../../body/control/select/ItemsetDefinition.ts';
import type { SelectItem } from '../../index.ts';
import type { SelectField } from '../../instance/SelectField.ts';
import type {
	EvaluationContext,
	EvaluationContextRoot,
} from '../../instance/internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from '../../instance/internal-api/SubscribableDependency.ts';
import type { TextRange } from '../../instance/text/TextRange.ts';
import { createComputedExpression } from './createComputedExpression.ts';
import type { ReactiveScope } from './scope.ts';
import { createTextRange } from './text/createTextRange.ts';

const createSelectItemLabel = (
	context: EvaluationContext,
	definition: ItemDefinition
): Accessor<TextRange<'label'>> => {
	const { label, value } = definition;

	return createTextRange(context, 'label', label, {
		fallbackValue: value,
	});
};

const buildStaticSelectItems = (
	selectField: SelectField,
	items: readonly ItemDefinition[]
): readonly SelectItem[] => {
	return selectField.scope.runTask(() => {
		return items.map((item) => {
			const { value } = item;
			const label = createSelectItemLabel(selectField, item);

			return {
				value,
				get label() {
					return label();
				},
			};
		});
	});
};

class ItemsetItemEvaluationContext implements EvaluationContext {
	readonly scope: ReactiveScope;
	readonly evaluator: XFormsXPathEvaluator;
	readonly root: EvaluationContextRoot;

	get contextReference(): string {
		return this.selectField.contextReference;
	}

	constructor(
		private readonly selectField: SelectField,
		readonly contextNode: Node
	) {
		this.scope = selectField.scope;
		this.evaluator = selectField.evaluator;
		this.root = selectField.root;
	}

	getSubscribableDependencyByReference(reference: string): SubscribableDependency | null {
		return this.selectField.getSubscribableDependencyByReference(reference);
	}
}

const createSelectItemsetItemLabel = (
	context: EvaluationContext,
	definition: ItemsetDefinition,
	itemValue: Accessor<string>
): Accessor<TextRange<'label'>> => {
	const { label } = definition;

	if (label == null) {
		return createMemo(() => {
			const value = itemValue();
			const staticValueLabel = createTextRange(context, 'label', label, {
				fallbackValue: value,
			});

			return staticValueLabel();
		});
	}

	return createTextRange(context, 'label', label);
};

// TODO: this is begging for caching.
const createItemset = (
	selectField: SelectField,
	itemset: ItemsetDefinition
): Accessor<readonly SelectItem[]> => {
	const { nodes: itemNodesExpression } = itemset;
	const itemNodes = createComputedExpression(selectField, itemNodesExpression);

	return createMemo(() => {
		return itemNodes().map((itemNode) => {
			const context = new ItemsetItemEvaluationContext(selectField, itemNode);
			const value = createComputedExpression(context, itemset.value);
			const label = createSelectItemsetItemLabel(context, itemset, value);

			return {
				get label() {
					return label();
				},
				get value() {
					return value();
				},
			};
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
	return selectField.scope.runTask(() => {
		const { items, itemset } = selectField.definition.bodyElement;

		if (itemset == null) {
			const staticItems = buildStaticSelectItems(selectField, items);

			return () => staticItems;
		}

		return createItemset(selectField, itemset);
	});
};
