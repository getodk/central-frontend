import type { CollectionValues } from '@getodk/common/types/collections/CollectionValues.ts';
import type { LocalNamedElement } from '@getodk/common/types/dom.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { SelectAppearanceDefinition } from '../appearance/selectAppearanceParser.ts';
import { selectAppearanceParser } from '../appearance/selectAppearanceParser.ts';
import type { AnyBodyElementDefinition, BodyElementParentContext } from '../BodyDefinition.ts';
import { ControlDefinition } from './ControlDefinition.ts';
import type { ItemDefinition } from './ItemDefinition.ts';
import type { ItemsetDefinition } from './ItemsetDefinition.ts';
import { parseItemCollection } from './parseItemCollection.ts';

const selectLocalNames = new Set(['select', 'select1'] as const);

export type SelectType = CollectionValues<typeof selectLocalNames>;

export interface SelectElement extends LocalNamedElement<SelectType> {}

const isSelectElement = (
  element: Element,
  localName: string = element.localName
): element is SelectElement => {
  return selectLocalNames.has(localName as SelectType);
};

export class SelectControlDefinition<Type extends SelectType> extends ControlDefinition<Type> {
  static override isCompatible(localName: string, element: Element): boolean {
    return isSelectElement(element, localName);
  }

  static isSelect(element: AnyBodyElementDefinition): element is AnySelectControlDefinition {
    return selectLocalNames.has(element.type as SelectType);
  }

  override readonly type: Type;
  override readonly element: SelectElement;
  readonly appearances: SelectAppearanceDefinition;

  readonly itemset: ItemsetDefinition | null;
  readonly items: readonly ItemDefinition[];

  constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
    if (!isSelectElement(element)) {
      throw new Error(`Invalid select element: <${element.nodeName}>`);
    }

    super(form, parent, element);

    this.type = element.localName as Type;
    this.element = element;
    this.appearances = selectAppearanceParser.parseFrom(element, 'appearance');

    const { items, itemset } = parseItemCollection(form, this);
    this.items = items;
    this.itemset = itemset;
  }

  override toJSON() {
    return {};
  }
}

export type AnySelectControlDefinition = SelectControlDefinition<SelectType>;
