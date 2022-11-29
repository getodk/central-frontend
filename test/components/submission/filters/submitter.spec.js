import Multiselect from '../../../../src/components/multiselect.vue';
import SubmissionFiltersSubmitter from '../../../../src/components/submission/filters/submitter.vue';

import useSubmissions from '../../../../src/request-data/submissions';

import createTestContainer from '../../../util/container';
import testData from '../../../data';
import { mergeMountOptions, mount } from '../../../util/lifecycle';
import { mockHttp } from '../../../util/http';
import { testRequestData } from '../../../util/request-data';

const mountComponent = (options = undefined) => {
  const submitters = testData.extendedFieldKeys.sorted()
    .sort((fieldKey1, fieldKey2) => (fieldKey1.id < fieldKey2.id ? -1 : 1))
    .map(testData.toActor);
  return mount(SubmissionFiltersSubmitter, mergeMountOptions(options, {
    props: { modelValue: submitters.map(({ id }) => id) },
    container: {
      requestData: testRequestData([useSubmissions], { submitters })
    }
  }));
};
const toggle = (multiselect) => multiselect.get('select').trigger('click');

describe('SubmissionFiltersSubmitter', () => {
  it('indicates whether the submitters are loading', () => {
    const container = createTestContainer({
      requestData: testRequestData([useSubmissions])
    });
    const { submitters } = container.requestData.localResources;
    return mockHttp(container)
      .mount(SubmissionFiltersSubmitter, {
        props: { modelValue: [] },
        container
      })
      .request(() => submitters.request({ url: '/v1/.../submitters' }))
      .beforeAnyResponse(component => {
        component.getComponent(Multiselect).props().loading.should.be.true();
      })
      .respondWithData(() => [])
      .afterResponse(component => {
        component.getComponent(Multiselect).props().loading.should.be.false();
      });
  });

  it('renders correctly if there was an error loading submitters', () => {
    const component = mount(SubmissionFiltersSubmitter, {
      props: { modelValue: [] },
      // !submitters.dataExists and also !submitters.awaitingResponse, meaning
      // that there was an error response.
      container: { requestData: testRequestData([useSubmissions]) }
    });
    const { options, loading } = component.getComponent(Multiselect).props();
    should.not.exist(options);
    loading.should.be.false();
  });

  it('renders the correct options', () => {
    const fieldKey1 = testData.extendedFieldKeys
      .createPast(1, { displayName: 'App User 1' })
      .last();
    const fieldKey2 = testData.extendedFieldKeys
      .createPast(1, { displayName: 'App User 2' })
      .last();
    mountComponent().getComponent(Multiselect).props().options.should.eql([
      { value: fieldKey1.id, text: 'App User 1' },
      { value: fieldKey2.id, text: 'App User 2' }
    ]);
  });

  it('passes the modelValue prop to the Multiselect', () => {
    const { id } = testData.extendedFieldKeys.createPast(1).last();
    const component = mountComponent({
      props: { modelValue: [id] }
    });
    component.getComponent(Multiselect).props().modelValue.should.eql([id]);
  });

  it('passes a new value for modelValue prop to Multiselect', async () => {
    const fieldKey1 = testData.extendedFieldKeys.createPast(1).last();
    const fieldKey2 = testData.extendedFieldKeys.createPast(1).last();
    const component = mountComponent({
      props: { modelValue: [fieldKey1.id, fieldKey2.id] }
    });
    await component.setProps({ modelValue: [fieldKey1.id] });
    const multiselect = component.getComponent(Multiselect);
    multiselect.props().modelValue.should.eql([fieldKey1.id]);
  });

  it('passes up an update:modelValue event from the Multiselect', async () => {
    const fieldKey1 = testData.extendedFieldKeys.createPast(1).last();
    const fieldKey2 = testData.extendedFieldKeys.createPast(1).last();
    const component = mountComponent({
      props: { modelValue: [fieldKey1.id, fieldKey2.id] },
      attachTo: document.body
    });
    const multiselect = component.getComponent(Multiselect);
    await toggle(multiselect);
    await multiselect.get('input[type="checkbox"]').setValue(false);
    await toggle(multiselect);
    multiselect.emitted('update:modelValue').should.eql([[[fieldKey2.id]]]);
    component.emitted('update:modelValue').should.eql([[[fieldKey2.id]]]);
  });

  describe('no submitters are selected', () => {
    it('falls back to all submitters', async () => {
      const fieldKey1 = testData.extendedFieldKeys.createPast(1).last();
      const fieldKey2 = testData.extendedFieldKeys.createPast(1).last();
      const component = mountComponent({
        props: { modelValue: [fieldKey1.id] },
        attachTo: document.body
      });
      const multiselect = component.getComponent(Multiselect);
      await toggle(multiselect);
      await multiselect.get('.select-none').trigger('click');
      await toggle(multiselect);
      multiselect.emitted('update:modelValue').should.eql([[[]]]);
      component.emitted('update:modelValue').should.eql([[
        [fieldKey1.id, fieldKey2.id]
      ]]);
    });

    describe('all submitters were already selected', () => {
      it('does not emit an event', async () => {
        const fieldKey = testData.extendedFieldKeys.createPast(1).last();
        const component = mountComponent({
          props: { modelValue: [fieldKey.id] },
          attachTo: document.body
        });
        const multiselect = component.getComponent(Multiselect);
        await toggle(multiselect);
        await multiselect.get('.select-none').trigger('click');
        await toggle(multiselect);
        multiselect.emitted('update:modelValue').should.eql([[[]]]);
        should.not.exist(component.emitted('update:modelValue'));
      });

      it('updates the Multiselect', async () => {
        const fieldKey = testData.extendedFieldKeys.createPast(1).last();
        const component = mountComponent({
          props: { modelValue: [fieldKey.id] },
          attachTo: document.body
        });
        const multiselect = component.getComponent(Multiselect);
        await toggle(multiselect);
        await multiselect.get('.select-none').trigger('click');
        await toggle(multiselect);
        multiselect.props().modelValue.should.eql([fieldKey.id]);
        await toggle(multiselect);
        const input = multiselect.get('input[type="checkbox"]');
        input.element.checked.should.be.true();
      });
    });
  });

  describe('modelValue prop includes an unknown submitter', () => {
    it('renders an option for each unknown submitter', () => {
      const fieldKey = testData.extendedFieldKeys
        .createPast(1, { displayName: 'My App User' })
        .last();
      const component = mountComponent({
        props: { modelValue: [23, 42] }
      });
      component.getComponent(Multiselect).props().options.should.eql([
        { value: 23, text: 'Unknown submitter' },
        { value: 42, text: 'Unknown submitter' },
        { value: fieldKey.id, text: 'My App User' }
      ]);
    });

    it('does not emit unknown submitters if selection is changed', async () => {
      const fieldKey = testData.extendedFieldKeys.createPast(1).last();
      const component = mountComponent({
        props: { modelValue: [23, 42] },
        attachTo: document.body
      });
      const multiselect = component.getComponent(Multiselect);
      await toggle(multiselect);
      await multiselect.findAll('input[type="checkbox"]')[2].setValue(true);
      await toggle(multiselect);
      multiselect.emitted('update:modelValue').should.eql([[[23, 42, fieldKey.id]]]);
      component.emitted('update:modelValue').should.eql([[[fieldKey.id]]]);
    });

    it('falls back to all submitters if only unknown submitters are selected', async () => {
      const fieldKey = testData.extendedFieldKeys.createPast(1).last();
      const component = mountComponent({
        props: { modelValue: [23, 42] },
        attachTo: document.body
      });
      const multiselect = component.getComponent(Multiselect);
      await toggle(multiselect);
      await multiselect.get('input[type="checkbox"]').setValue(false);
      await toggle(multiselect);
      multiselect.emitted('update:modelValue').should.eql([[[42]]]);
      component.emitted('update:modelValue').should.eql([[[fieldKey.id]]]);
    });
  });
});
