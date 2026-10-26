import FormQuestion from '@getodk/web-forms/components/form-layout/FormQuestion.vue';
import {
  SUBMIT_PRESSED,
  IS_FORM_EDIT_MODE,
} from '@getodk/web-forms/lib/constants/injection-keys.ts';
import { mount } from '@vue/test-utils';
import { assert, describe, expect, it } from 'vitest';
import { ref, shallowRef } from 'vue';
import { getReactiveForm, globalMountOptions } from '../../../helpers';

describe('InputNumeric', () => {
  const mountComponent = async (questionNumber: number, submitPressed = false) => {
    const xform = await getReactiveForm('input-numeric.xml');
    const question = xform.currentState.children[questionNumber];

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

  it('sets the correct inputmode for integers', async () => {
    const component = await mountComponent(0);
    expect(component.get('input').attributes().inputmode).toBe('numeric');
  });

  it('sets the correct inputmode for decimals', async () => {
    const component = await mountComponent(1);
    expect(component.get('input').attributes().inputmode).toBe('decimal');
  });
});
