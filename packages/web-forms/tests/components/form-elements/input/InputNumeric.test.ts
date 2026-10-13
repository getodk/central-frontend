import FormQuestion from '@getodk/web-forms/components/form-layout/FormQuestion.vue';
import {
  SUBMIT_PRESSED,
  IS_FORM_EDIT_MODE,
} from '@getodk/web-forms/lib/constants/injection-keys.ts';
import { mount, VueWrapper } from '@vue/test-utils';
import { assert, describe, expect, it, beforeEach } from 'vitest';
import { ref, shallowRef } from 'vue';
import { getReactiveForm, globalMountOptions } from '../../../helpers';
import type { GeneralChildNode } from '@getodk/xforms-engine';

describe('InputNumeric', () => {
  let question: GeneralChildNode;
  let component: VueWrapper;

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

  describe('integer', () => {
    beforeEach(async () => {
      component = await mountComponent(0);
    });

    it('sets the correct inputmode', () => {
      expect(component.get('input').attributes().inputmode).toBe('numeric');
    });

    it('trims the value', async () => {
      await component.get('input').setValue('   1   ');
      expect(question.currentState.value).toBe(1n);
    });

    it('empty = null', async () => {
      await component.get('input').setValue('    ');
      expect(question.currentState.value).toBeNull();
    });

    it('rounds integers', async () => {
      await component.get('input').setValue('1.59');
      expect(question.currentState.value).toBe(2n);
    });
  });

  describe('decimal', () => {
    beforeEach(async () => {
      component = await mountComponent(1);
    });

    it('sets the correct inputmode', () => {
      expect(component.get('input').attributes().inputmode).toBe('decimal');
    });
  });
});
