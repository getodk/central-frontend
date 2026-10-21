import type { XFormDefinition } from '../../XFormDefinition.ts';
import type { BodyElementParentContext } from '../BodyDefinition.ts';
import { ControlDefinition } from './ControlDefinition.ts';
import type { ItemsetDefinition } from './ItemsetDefinition.ts';
import type { ItemDefinition } from './ItemDefinition.ts';
import { parseItemCollection } from './parseItemCollection.ts';
import {
  type UnknownAppearanceDefinition,
  unknownAppearanceParser,
} from '../appearance/unknownAppearanceParser.ts';

export class RankControlDefinition extends ControlDefinition<'rank'> {
  static override isCompatible(localName: string): boolean {
    return localName === 'rank';
  }

  readonly type = 'rank';
  readonly appearances: UnknownAppearanceDefinition;
  readonly itemset: ItemsetDefinition | null;
  readonly items: readonly ItemDefinition[];

  constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
    super(form, parent, element);

    this.appearances = unknownAppearanceParser.parseFrom(element, 'appearance');

    const { items, itemset } = parseItemCollection(form, this);
    this.items = items;
    this.itemset = itemset;
  }

  override toJSON() {
    return {};
  }
}
