import FormQuestion from '@getodk/web-forms/components/form-layout/FormQuestion.vue';
import {
  SUBMIT_PRESSED,
  IS_FORM_EDIT_MODE,
} from '@getodk/web-forms/lib/constants/injection-keys.ts';
import { mount, VueWrapper } from '@vue/test-utils';
import { assert, describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { ref, shallowRef } from 'vue';
import { getReactiveForm, globalMountOptions } from '../../../helpers';
import type { GeneralChildNode } from '@getodk/xforms-engine';

describe('InputNumeric', () => {
  let question: GeneralChildNode;
  let component: VueWrapper;

  const POLISH_NAVIGATOR = {
    languages: ['pl', 'en'],
    language: 'en',
  };

  const ENGLISH_NAVIGATOR = {
    languages: ['en', 'pl'],
    language: 'en',
  };

  const increment = async () => await component.get('.increment').trigger('pointerdown');
  const decrement = async () => await component.get('.decrement').trigger('pointerdown');

  const mountComponent = async (
    questionNumber: number,
    submitPressed = false
  ): Promise<VueWrapper> => {
    const xform = await getReactiveForm('input-numeric.xml');
    question = xform.currentState.children[questionNumber]!;

    assert(question?.nodeType === 'input');

    return mount(FormQuestion, {
      props: { question },
      global: {
        ...globalMountOptions,
        provide: {
          ...globalMountOptions.provide,
          [SUBMIT_PRESSED]: ref(submitPressed),
          [IS_FORM_EDIT_MODE]: shallowRef(false),
        },
      },
      attachTo: document.body,
    });
  };

  beforeEach(() => {
    vi.stubGlobal('navigator', ENGLISH_NAVIGATOR);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('integer', () => {
    it('sets the correct inputmode', async () => {
      component = await mountComponent(0);
      expect(component.get('input').attributes().inputmode).toBe('numeric');
    });

    it('handles dots for thousands separators', async () => {
      vi.stubGlobal('navigator', POLISH_NAVIGATOR);
      component = await mountComponent(0);
      await component.get('input').setValue('1.2345');
      expect(question.currentState.value).toBe(12345n);
    });

    describe('handles input', () => {
      beforeEach(async () => {
        component = await mountComponent(0);
      });

      [
        { given: '   1   ', expected: 1n },
        { given: '    ', expected: null },
        { given: '1.59', expected: 2n },
        { given: '1,234', expected: 1234n },
        { given: '1234.', expected: 1234n },
      ].forEach(({ given, expected }) => {
        it(`${given}`, async () => {
          await component.get('input').setValue(given);
          expect(question.currentState.value).toBe(expected);
        });
      });
    });

    it('buttons increment and decrement value', async () => {
      component = await mountComponent(0);
      await component.get('input').setValue('3');
      await increment();
      expect(question.currentState.value).toBe(4n);
      await decrement();
      await decrement();
      await decrement();
      await decrement();
      await decrement();
      expect(question.currentState.value).toBe(-1n);
    });
  });

  describe('decimal', () => {
    it('sets the correct inputmode', async () => {
      component = await mountComponent(1);
      expect(component.get('input').attributes().inputmode).toBe('decimal');
    });

    describe('comma separators', () => {
      beforeEach(async () => {
        vi.stubGlobal('navigator', POLISH_NAVIGATOR);
        component = await mountComponent(1);
      });

      [
        { given: '56,123', expected: 56.123 },
        { given: '56.123', expected: 56123 },
        { given: ',123', expected: 0.123 },
        { given: '56.123.456', expected: 56123456 },
        { given: '0,1234567890123456789', expected: null },
        { given: '1234567890123456789', expected: null },
      ].forEach(({ given, expected }) => {
        it(`handles ${given}`, async () => {
          await component.get('input').setValue(given);
          expect(question.currentState.value).toBe(expected);
        });
      });
    });

    describe('fullstop separators', () => {
      beforeEach(async () => {
        component = await mountComponent(1);
      });

      [
        { given: '56.123', expected: 56.123 },
        { given: '56,123', expected: 56123 },
        { given: '.123', expected: 0.123 },
        { given: '56,123,456', expected: 56123456 },
        { given: '0.1234567890123456789', expected: null },
        { given: '1234567890123456789', expected: null },
      ].forEach(({ given, expected }) => {
        it(`handles ${given}`, async () => {
          await component.get('input').setValue(given);
          expect(question.currentState.value).toBe(expected);
        });
      });
    });

    it('clears the model value when value is invalid', async () => {
      component = await mountComponent(1);
      await component.get('input').setValue('0.5');
      await component.get('input').setValue('0.'); // simulate backspace
      expect(question.currentState.value).toBe(null);
      expect(component.get('input').element.value).toBe('0.');
    });

    it('buttons increment and decrement value', async () => {
      component = await mountComponent(1);
      await component.get('input').setValue('3.25');
      await increment();
      expect(question.currentState.value).toBe(4.25);
      await decrement();
      await decrement();
      await decrement();
      await decrement();
      await decrement();
      expect(question.currentState.value).toBe(-0.75);
      await increment();
      expect(question.currentState.value).toBe(0.25);
    });
  });
});
