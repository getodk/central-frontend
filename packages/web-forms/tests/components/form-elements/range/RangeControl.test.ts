import FormQuestion from '@getodk/web-forms/components/form-layout/FormQuestion.vue';
import { mount } from '@vue/test-utils';
import { assert, describe, expect, it } from 'vitest';
import { getReactiveForm, globalMountOptions } from '../../../helpers';

describe('RangeControl', () => {
  const mountQuestion = async (questionIndex: number) => {
    const xform = await getReactiveForm('range-tick-labels.xml');
    const question = xform.currentState.children[questionIndex];

    assert(question?.nodeType === 'range');

    return mount(FormQuestion, {
      props: { question },
      global: globalMountOptions,
    });
  };

  it('renders a tick on every step and the labels sorted from start to end', async () => {
    const component = await mountQuestion(0);
    const labels = component.findAll('.range-tick-label');

    expect(component.findAll('.range-tick')).toHaveLength(11);
    expect(labels.map((label) => label.text())).toEqual(['Low', 'Mid', 'High']);
  });

  it('marks the labels at start and end', async () => {
    const component = await mountQuestion(0);
    const labels = component.findAll('.range-tick-label');

    expect(labels[0]!.classes()).toContain('at-start');
    expect(labels[1]!.classes()).not.toContain('at-start');
    expect(labels[1]!.classes()).not.toContain('at-end');
    expect(labels[2]!.classes()).toContain('at-end');
  });

  it('renders vertical labels in a column', async () => {
    const component = await mountQuestion(1);

    expect(component.find('.range-control-container').classes()).toContain('vertical');
    expect(component.findAll('.range-tick')).toHaveLength(11);
    expect(component.findAll('.range-tick-label').map((label) => label.text())).toEqual([
      'Bottom',
      'Middle',
      'Top',
    ]);
  });

  it('shows only start and end labels without ticks', async () => {
    const component = await mountQuestion(2);
    const labels = component.findAll('.range-tick-label');

    expect(component.findAll('.range-tick')).toHaveLength(0);
    expect(labels.map((label) => label.text())).toEqual(['Low', 'High']);
  });

  it('renders no label row without items', async () => {
    const component = await mountQuestion(3);

    expect(component.find('.range-tick-labels').exists()).toBe(false);
  });

  describe('placeholder', () => {
    const mountPlaceholderQuestion = () => mountQuestion(6);

    it('shows the thumb at the placeholder without saving a value', async () => {
      const component = await mountPlaceholderQuestion();

      expect(component.find('.range-thumb').exists()).toBe(true);
      expect(component.find('.range-thumb').classes()).toContain('range-thumb-placeholder');
      expect(component.find('.range-fill').exists()).toBe(false);
      expect(component.find('.range-value').text()).toBe('');
    });

    it('saves the placeholder when the thumb is clicked', async () => {
      const component = await mountPlaceholderQuestion();

      await component.find('.range-thumb').trigger('click');

      expect(component.find('.range-thumb').classes()).not.toContain('range-thumb-placeholder');
      expect(component.find('.range-fill').exists()).toBe(true);
      expect(component.find('.range-value').text()).toBe('50');
    });
  });
});
