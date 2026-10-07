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
import type { XFormsElement } from '@getodk/common/test-utils/xform-dsl/XFormsElement.ts';
import { describe, expect, it } from 'vitest';
import { RangeControlDefinition } from '../../../../src/parse/body/control/RangeControlDefinition.ts';
import { XFormDefinition } from '../../../../src/parse/XFormDefinition.ts';
import { XFormDOM } from '../../../../src/parse/XFormDOM.ts';

describe('RangeControlDefinition', () => {
  const createFromBody = (type: string, rangeElement: XFormsElement) => {
    const xform = html(
      head(
        title('Range definition'),
        model(
          mainInstance(t('root id="body-definition"', t('range'))),
          bind('/root/range').type(type)
        )
      ),
      body(rangeElement)
    );

    const xformDOM = XFormDOM.from(xform.asXml());
    const xformDefinition = new XFormDefinition(xformDOM);
    const element = xformDefinition.body.element.children[0];

    return new RangeControlDefinition(xformDefinition, xformDefinition.body, element!);
  };

  const create = (type: string, start: number, end: number, step: number) => {
    return createFromBody(type, range('/root/range', { start, end, step }));
  };

  const createWithTickInterval = (tickInterval: string) => {
    return createFromBody(
      'int',
      t(`range ref="/root/range" start="0" end="10" step="1" odk:tick-interval="${tickInterval}"`)
    );
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

  describe('tick interval', () => {
    it('is null when the attribute is not defined', () => {
      expect(create('int', 0, 10, 1).options.tickInterval).to.equal(null);
    });

    it('parses the odk:tick-interval attribute', () => {
      expect(createWithTickInterval('5').options.tickInterval).to.equal(5);
    });

    it('fails to parse a tick interval which is not a number', () => {
      expect(() => createWithTickInterval('five')).to.throw();
    });
  });
});
