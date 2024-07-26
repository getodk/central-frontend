import Multiselect from '../../../../src/components/multiselect.vue';
import SubmissionFiltersReviewState from '../../../../src/components/submission/filters/review-state.vue';

import { mergeMountOptions, mount } from '../../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(SubmissionFiltersReviewState, mergeMountOptions(options, {
    props: { modelValue: ['null'] }
  }));
const toggle = (multiselect) => multiselect.get('select').trigger('click');

describe('SubmissionFiltersReviewState', () => {
  it('renders the correct options', () => {
    mountComponent().getComponent(Multiselect).props().options.should.eql([
      { value: 'null', text: 'Received' },
      { value: "'hasIssues'", text: 'Has issues' },
      { value: "'edited'", text: 'Edited' },
      { value: "'approved'", text: 'Approved' },
      { value: "'rejected'", text: 'Rejected' }
    ]);
  });

  it('passes the modelValue prop to the Multiselect', () => {
    const component = mountComponent({
      props: { modelValue: ['null', "'approved'"] }
    });
    const multiselect = component.getComponent(Multiselect);
    expect(multiselect.props().modelValue).to.eql(['null', "'approved'"]);
  });

  it('passes a new value for modelValue prop to Multiselect', async () => {
    const component = mountComponent({
      props: { modelValue: ['null', "'approved'"] }
    });
    await component.setProps({ modelValue: ['null'] });
    expect(component.getComponent(Multiselect).props().modelValue).to.eql(['null']);
  });

  it('emits an update:modelValue event if selection is changed', async () => {
    const component = mountComponent({
      props: { modelValue: ['null', "'approved'"] },
      attachTo: document.body
    });
    const multiselect = component.getComponent(Multiselect);
    await toggle(multiselect);
    await multiselect.get('input[type="checkbox"]').setValue(false);
    await toggle(multiselect);
    component.emitted('update:modelValue').should.eql([[["'approved'"]]]);
  });

  describe('no review states are selected', () => {
    const all = ['null', "'hasIssues'", "'edited'", "'approved'", "'rejected'"];

    it('falls back to all review states', async () => {
      const component = mountComponent({
        props: { modelValue: ['null'] },
        attachTo: document.body
      });
      const multiselect = component.getComponent(Multiselect);
      await toggle(multiselect);
      await multiselect.get('.select-none').trigger('click');
      await toggle(multiselect);
      component.emitted('update:modelValue').should.eql([[all]]);
    });

    it('does not emit an event if all were already selected', async () => {
      const component = mountComponent({
        props: { modelValue: all },
        attachTo: document.body
      });
      const multiselect = component.getComponent(Multiselect);
      await toggle(multiselect);
      await multiselect.get('.select-none').trigger('click');
      await toggle(multiselect);
      should.not.exist(component.emitted('update:modelValue'));
    });
  });
});
