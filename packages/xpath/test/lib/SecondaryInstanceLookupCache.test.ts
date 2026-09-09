import { xml } from '@getodk/common/test-utils/xml.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DefaultDOMAdapterNode } from '../../src/adapter/defaults.ts';
import { DEFAULT_DOM_ADAPTER } from '../../src/adapter/defaults.ts';
import { Evaluator } from '../../src/evaluator/Evaluator.ts';
import { SecondaryInstanceLookupCache } from '../../src/lib/SecondaryInstanceLookupCache.ts';

describe('Secondary instance lookup cache', () => {
  
  beforeEach(() => {
    SecondaryInstanceLookupCache.getCache().clear();
  });
  
  describe('generateKey', () => {
    
    let testDocument: XMLDocument;
    let evaluator: Evaluator<DefaultDOMAdapterNode>;

    beforeEach(() => {
      testDocument = xml`<root>
        <instance id="primary">
          <a>3</a>
          <b>4</b>
        </instance>
        <instance id="second">
          <item id="1">a</item>
          <item id="2">b</item>
          <item id="3" color="blue" size="large"></item>
          <item id="4" color="green" size="small">d</item>
          <item id="5" color="blue" size="small">e</item>
          <item id="6" color="green" size="large">f</item>
          <item id="7">g</item>
          <item id="8">h</item>
          <item id="9">i</item>
          <item id="10">j</item>
          <item id="11">k</item>
          <item id="12">l</item>
        </instance>
        <instance id="sizes">
          <a>large</a>
        </instance>
        <instance id="colors">
          <a>blue</a>
        </instance>
      </root>`;
      evaluator = new Evaluator({
        domAdapter: DEFAULT_DOM_ADAPTER,
        rootNode: testDocument,
      });
    });

    it('does not cache for small numbers of nodes', () => {
      const expected = testDocument.querySelector('a')!;
      const actual = evaluator.evaluateNode('/root/instance[@id="primary"]/a');
      expect(actual).toBe(expected);
      expect(SecondaryInstanceLookupCache.getCache().size).toEqual(0);
    });

    it('caches node query', () => {
      const expected = testDocument.getElementById('3')!;
      evaluator.evaluateNode('/root/instance[@id="second"]/item[@id=/root/instance[@id="primary"]/a]');
      expect(SecondaryInstanceLookupCache.getCache().size).toEqual(1);
      expect(SecondaryInstanceLookupCache.get('/root/instance[@id="second"]/item[@id=3]')).toEqual([expected]);
    });

    it('caches node query for reuse for future queries', () => {
      const expected = testDocument.getElementById('3')!;
      const color = evaluator.evaluateString('/root/instance[@id="second"]/item[@id=/root/instance[@id="primary"]/a]/@color');
      expect(color).toEqual('blue');
      const size = evaluator.evaluateString('/root/instance[@id="second"]/item[@id=/root/instance[@id="primary"]/a]/@size');
      expect(size).toEqual('large');
      expect(SecondaryInstanceLookupCache.getCache().size).toEqual(1);
      expect(SecondaryInstanceLookupCache.get('/root/instance[@id="second"]/item[@id=3]')).toEqual([expected]);
    });

    it('caches node query with multiple predicates', () => {
      const expected = testDocument.getElementById('3')!;
      const color = evaluator.evaluateString('/root/instance[@id="second"]/item[@color=/root/instance[@id="colors"]/a][@size=/root/instance[@id="sizes"]/a]/@color');
      expect(color).toEqual('blue');
      const size = evaluator.evaluateString('/root/instance[@id="second"]/item[@color=/root/instance[@id="colors"]/a][@size=/root/instance[@id="sizes"]/a]/@size');
      expect(size).toEqual('large');
      expect(SecondaryInstanceLookupCache.getCache().size).toEqual(1);
      expect(SecondaryInstanceLookupCache.get('/root/instance[@id="second"]/item[@color=blue][@size=large]')).toEqual([expected]);
    });

    it('does not reuse the cache item when the query does not match', () => {
      const expected3 = testDocument.getElementById('3')!;
      const expected4 = testDocument.getElementById('4')!;
      const color = evaluator.evaluateString('/root/instance[@id="second"]/item[@id=/root/instance[@id="primary"]/a]/@color');
      expect(color).toEqual('blue');
      const size = evaluator.evaluateString('/root/instance[@id="second"]/item[@id=/root/instance[@id="primary"]/b]/@size');
      expect(size).toEqual('small');
      expect(SecondaryInstanceLookupCache.getCache().size).toEqual(2);
      expect(SecondaryInstanceLookupCache.get('/root/instance[@id="second"]/item[@id=3]')).toEqual([expected3]);
      expect(SecondaryInstanceLookupCache.get('/root/instance[@id="second"]/item[@id=4]')).toEqual([expected4]);
    });
  });

  it('does not cache primary instance', () => {
    const testDocument = xml`<root id="x">
      <instance id="y">
        <item id="1">a</item>
        <item id="2">b</item>
        <item id="3" color="blue" size="large"></item>
        <item id="4" color="green" size="small">d</item>
        <item id="5" color="blue" size="small">e</item>
        <item id="6" color="green" size="large">f</item>
        <item id="7">g</item>
        <item id="8">h</item>
        <item id="9">i</item>
        <item id="10">j</item>
        <item id="11">k</item>
        <item id="12">l</item>
      </instance>
      <instance id="second">
        <a>3</a>
      </instance>
    </root>`;
    const evaluator = new Evaluator({
      domAdapter: DEFAULT_DOM_ADAPTER,
      rootNode: testDocument,
    });
    const color = evaluator.evaluateString('/root/instance[1]/item[@id=/root/instance[@id="second"]/a]/@color');
    expect(color).toEqual('blue');
    expect(SecondaryInstanceLookupCache.getCache().size).toEqual(0);
  });

  // TODO test predicates in different steps - don't cache the inner ones
  // TODO test that it does not cache relative paths
  // TODO test it does not cache '//'
  // TODO test other operators - should it cache lt?
  // TODO test functions and mutliple nested functions (recursion)
});
