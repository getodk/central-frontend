import ControlHint from '@getodk/web-forms/components/form-elements/ControlHint.vue';
import type { AnyInputNode } from '@getodk/xforms-engine';
import { mount, VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { globalMountOptions } from '../../helpers';

const baseQuestion = {
  nodeType: 'input',
  currentState: {
    label: {
      formatted: [{ role: 'child', value: 'First Name' }],
    },
    hint: {
      formatted: [{ role: 'child', value: 'Enter your first name' }],
      guidance: [{ role: 'child', value: 'For example, Jane' }],
    },
  },
} as AnyInputNode;

describe('ControlHint', () => {
  let component: VueWrapper;

  beforeEach(() => {
    component = mount(ControlHint, {
      props: {
        question: baseQuestion,
      },
      global: globalMountOptions,
    }) as VueWrapper;
  });

  it('shows hint text', () => {
    expect(component.find('.hint > div:first-child').text()).toEqual('Enter your first name');
  });

  it('shows guidance accordion', async () => {
    expect(component.find('.hint summary').text()).toEqual('control_hint.details.label');
    expect(component.find('.hint details').attributes('open')).toEqual(undefined);
    await component.find('.hint summary').trigger('click');
    expect(component.find('.hint details').attributes('open')).toEqual('');
    expect(component.find('.hint details div').text()).toEqual('For example, Jane');
    await component.find('.hint summary').trigger('click');
    expect(component.find('.hint details').attributes('open')).toEqual(undefined);
  });
});
