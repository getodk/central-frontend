import { UpsertableMap } from '@getodk/common/lib/collections/UpsertableMap.ts';
import type { Accessor } from 'solid-js';
import { createEffect, createMemo, on } from 'solid-js';
import type { ActiveLanguage } from '../../client/FormLanguage.ts';
import type { BaseItem } from '../../client/BaseItem.ts';
import type { TextRange as ClientTextRange } from '../../client/TextRange.ts';
import type { EvaluationContext } from '../../instance/internal-api/EvaluationContext.ts';
import type { TranslationContext } from '../../instance/internal-api/TranslationContext.ts';
import type { RankControl } from '../../instance/RankControl.ts';
import type { SelectControl } from '../../instance/SelectControl.ts';
import { TextChunk } from '../../instance/text/TextChunk.ts';
import { TextRange } from '../../instance/text/TextRange.ts';
import type { EngineXPathNode } from '../../integration/xpath/adapter/kind.ts';
import type { EngineXPathEvaluator } from '../../integration/xpath/EngineXPathEvaluator.ts';
import type { ItemDefinition } from '../../parse/body/control/ItemDefinition.ts';
import type { ItemsetDefinition } from '../../parse/body/control/ItemsetDefinition.ts';
import { createComputedExpression } from './createComputedExpression.ts';
import type { ReactiveScope } from './scope.ts';
import { createTextRange } from './text/createTextRange.ts';

type ItemCollectionControl = RankControl | SelectControl;
type DerivedItemLabel = ClientTextRange<'item-label'>;

const derivedItemLabel = (context: TranslationContext, value: string): DerivedItemLabel => {
  const chunk = new TextChunk(context, 'literal', value);

  return new TextRange('item-label', [chunk]);
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
): Accessor<readonly BaseItem[]> => {
  return control.scope.runTask(() => {
    const labeledItems = items.map((item) => {
      const { value } = item;
      const label = createItemLabel(control, item);

      return () => ({
        value,
        label: label(),
        properties: [],
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
  properties: Array<[string, () => string]>;
}

const MAX_CHANGES_PER_UPDATE = 100;

const nodeListsEqual = (a: readonly EngineXPathNode[], b: readonly EngineXPathNode[]) => {
  return a.length === b.length && a.every((node, index) => node === b[index]);
};

/**
 * A self-referencing choice filter recomputes forever. Reaching the limit in one
 * update the memo keeps its previous result, ending the cycle.
 */
const createCycleGuardedItemNodes = (
  control: ItemCollectionControl,
  itemset: ItemsetDefinition
): Accessor<EngineXPathNode[]> => {
  const evaluateNodes = createComputedExpression(control, itemset.nodes, { defaultValue: [] });

  let changeCount = 0;
  const itemNodes = createMemo((previous?: EngineXPathNode[]) => {
    const result = evaluateNodes();
    if (previous === undefined) {
      return result;
    }
    if (nodeListsEqual(result, previous)) {
      return previous;
    }
    changeCount += 1;
    if (changeCount <= MAX_CHANGES_PER_UPDATE) {
      return result;
    }
    // Settle on the phase showing more options, so a filtered-out answer stays visible.
    return result.length > previous.length ? result : previous;
  });
  createEffect(on(itemNodes, () => (changeCount = 0)));

  return itemNodes;
};

const createItemsetItems = (
  control: ItemCollectionControl,
  itemset: ItemsetDefinition
): Accessor<readonly ItemsetItem[]> => {
  return control.scope.runTask(() => {
    const itemNodes = createCycleGuardedItemNodes(control, itemset);
    const itemsCache = new UpsertableMap<EngineXPathNode, ItemsetItem>();

    return createMemo(() => {
      return itemNodes().map((itemNode) => {
        return itemsCache.upsert(itemNode, () => {
          const context = new ItemsetItemEvaluationContext(control, itemNode);
          const value = createComputedExpression(context, itemset.value, {
            defaultValue: '',
          });
          const label = createItemsetItemLabel(context, itemset, value);

          const nodeElements = itemNode
            .getXPathChildNodes()
            .filter((node) => node.nodeType === 'static-element');
          const properties = itemset.getPropertiesExpressions(nodeElements).map((expression) => {
            return [expression.toString(), createComputedExpression(context, expression)] as [
              string,
              () => string,
            ];
          });

          return {
            label,
            value,
            properties,
          };
        });
      });
    });
  });
};

const createItemset = (
  control: ItemCollectionControl,
  itemset: ItemsetDefinition
): Accessor<readonly BaseItem[]> => {
  return control.scope.runTask(() => {
    const itemsetItems = createItemsetItems(control, itemset);

    return createMemo(() => {
      return itemsetItems().map((item) => {
        return {
          label: item.label(),
          value: item.value(),
          properties: item.properties.map(
            ([propLabel, propValue]) => [propLabel, propValue()] as [string, string]
          ),
        };
      });
    });
  });
};

/**
 * Creates a reactive computation of a {@link ItemCollectionControl}'s
 * {@link BaseItem}s, in support of the field's `valueOptions`.
 *
 * - The control defined with static `<item>`s will compute to an corresponding
 *   static list of items.
 * - The control defined with a computed `<itemset>` will compute to a reactive list
 *   of items.
 * - Items of both will produce {@link ItemType.label | labels} reactive to
 *   their appropriate dependencies (whether relative to the itemset item node,
 *   referencing a form's `itext` translations, etc).
 */
export const createItemCollection = (
  control: ItemCollectionControl
): Accessor<readonly BaseItem[]> => {
  const { items, itemset } = control.definition.bodyElement;

  if (itemset != null) {
    return createItemset(control, itemset);
  }

  return createTranslatedStaticItems(control, items);
};
