import {
  bind,
  body,
  head,
  html,
  mainInstance,
  model,
  range,
  t,
  title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { RangeControlDefinition } from '../../../../src/parse/body/control/RangeControlDefinition.ts';
import { XFormDefinition } from '../../../../src/parse/XFormDefinition.ts';
import { XFormDOM } from '../../../../src/parse/XFormDOM.ts';

describe('RangeControlDefinition', () => {
  const create = (type: string, start: number, end: number, step: number) => {
    const xform = html(
      head(
        title('Range definition'),
        model(
          mainInstance(t('root id="body-definition"', t('range'))),
          bind('/root/range').type(type)
        )
      ),
      body(range('/root/range', { start, end, step }))
    );

    const xformDOM = XFormDOM.from(xform.asXml());
    const xformDefinition = new XFormDefinition(xformDOM);
    const rangeElement = xformDefinition.body.element.children[0];

    return new RangeControlDefinition(xformDefinition, xformDefinition.body, rangeElement!);
  };

  describe('bounds', () => {
    describe('int', () => {
      it('parses', () => {
        const definition = create('int', -2, 10, 2);
        expect(definition.bounds.start).to.equal('-2');
        expect(definition.bounds.step).to.equal('2');
        expect(definition.bounds.end).to.equal('10');
      });

      it('takes the absolute value of step', () => {
        const definition = create('int', 0, 10, -2);
        expect(definition.bounds.start).to.equal('0');
        expect(definition.bounds.step).to.equal('2');
        expect(definition.bounds.end).to.equal('10');
      });
    });

    describe('decimal', () => {
      it('parses', () => {
        const definition = create('decimal', -2.5, 10.5, 2.5);
        expect(definition.bounds.start).to.equal('-2.5');
        expect(definition.bounds.step).to.equal('2.5');
        expect(definition.bounds.end).to.equal('10.5');
      });

      it('takes the absolute value of step', () => {
        const definition = create('decimal', 0, 10, -2.5);
        expect(definition.bounds.start).to.equal('0');
        expect(definition.bounds.step).to.equal('2.5');
        expect(definition.bounds.end).to.equal('10');
      });
    });
  });
});
