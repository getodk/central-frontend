import {
  bind,
  body,
  head,
  html,
  item,
  mainInstance,
  model,
  select1,
  t,
  title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import type { XFormsElement } from '@getodk/common/test-utils/xform-dsl/XFormsElement.ts';
import { describe, expect, it } from 'vitest';
import { parseItemCollection } from '../../../../src/parse/body/control/parseItemCollection.ts';
import { SelectControlDefinition } from '../../../../src/parse/body/control/SelectControlDefinition.ts';
import { XFormDefinition } from '../../../../src/parse/XFormDefinition.ts';
import { XFormDOM } from '../../../../src/parse/XFormDOM.ts';

describe('parseItemCollection', () => {
  const itemset = t('itemset nodeset="instance(\'list\')/root/item"', t('value ref="name"'));

  const parse = (...children: XFormsElement[]) => {
    const xform = html(
      head(
        title('Item collection'),
        model(
          mainInstance(t('root id="item-collection"', t('sel'))),
          t('instance id="list"', t('root', t('item', t('name', 'a')))),
          bind('/root/sel').type('string')
        )
      ),
      body(select1('/root/sel', ...children))
    );
    const xformDefinition = new XFormDefinition(XFormDOM.from(xform.asXml()));
    const element = xformDefinition.body.element.children[0]!;
    const control = new SelectControlDefinition(xformDefinition, xformDefinition.body, element);

    return parseItemCollection(xformDefinition, control);
  };

  it('parses <item> children in document order', () => {
    const collection = parse(item('b', 'B'), item('a', 'A'));

    expect(collection.itemset).toBeNull();
    expect(collection.items.map((definition) => definition.value)).toEqual(['b', 'a']);
  });

  it('parses an <itemset> child', () => {
    const collection = parse(itemset);

    expect(collection.items).toEqual([]);
    expect(collection.itemset?.nodes.expression).toBe("instance('list')/root/item");
  });

  it('is empty without items or an itemset', () => {
    const collection = parse();

    expect(collection.items).toEqual([]);
    expect(collection.itemset).toBeNull();
  });

  it('fails when both <item> and <itemset> are present', () => {
    expect(() => parse(item('a', 'A'), itemset)).toThrow(
      '<select1> has both <itemset> and <item> children'
    );
  });
});
