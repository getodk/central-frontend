import SubmissionFiltersSubmitter from '../../../../src/components/submission/filters/submitter.vue';

import testData from '../../../data';
import { load } from '../../../util/http';
import { loadSubmissionList } from '../../../util/submission';
import { mergeMountOptions, mount } from '../../../util/lifecycle';
import { mockLogin } from '../../../util/session';
import { testRequestData } from '../../../util/request-data';

const mountComponent = (options = undefined) =>
  mount(SubmissionFiltersSubmitter, mergeMountOptions(options, {
    props: { modelValue: '' },
    container: {
      requestData: testRequestData(['submitters'], {
        submitters: testData.extendedFieldKeys
          .sorted()
          .sort((fieldKey1, fieldKey2) =>
            fieldKey1.displayName.localeCompare(fieldKey2.displayName))
          .map(testData.toActor)
      })
    }
  }));

describe('SubmissionFiltersSubmitter', () => {
  describe('submitters are loading', () => {
    beforeEach(() => {
      mockLogin();
      testData.extendedForms.createPast(1);
    });

    it('disables the select element', () =>
      loadSubmissionList().beforeAnyResponse(component => {
        const select = component.get('#submission-filters-submitter select');
        select.element.disabled.should.be.true();
      }));

    it('shows a loading message', () =>
      loadSubmissionList().beforeAnyResponse(component => {
        const options = component.findAll('#submission-filters-submitter option');
        options.map(option => option.text()).should.eql(['Loading…']);
      }));
  });

  it('renders the correct options', () => {
    const fieldKey1 = testData.extendedFieldKeys
      .createPast(1, { displayName: 'App User 1' })
      .last();
    const fieldKey2 = testData.extendedFieldKeys
      .createPast(1, { displayName: 'App User 2' })
      .last();
    const options = mountComponent().findAll('option');
    options.length.should.equal(3);
    options[0].attributes().value.should.equal('');
    options[0].text().should.equal('(Anybody)');
    options[1].attributes().value.should.equal(fieldKey1.id.toString());
    options[1].text().should.equal('App User 1');
    options[2].attributes().value.should.equal(fieldKey2.id.toString());
    options[2].text().should.equal('App User 2');
  });

  it('sets the value of the select element to the modelValue prop', () => {
    const id = testData.extendedFieldKeys.createPast(1).last().id.toString();
    const component = mountComponent({
      props: { modelValue: id }
    });
    component.get('select').element.value.should.equal(id);
  });

  it('sets value of select element once submitters have loaded', () => {
    mockLogin();
    testData.extendedProjects.createPast(1, { forms: 1, appUsers: 1 });
    const submitter = testData.extendedFieldKeys.createPast(1).last();
    testData.extendedSubmissions.createPast(1, { submitter });
    const id = submitter.id.toString();
    return load(`/projects/1/forms/f/submissions?submitterId=${id}`, { root: false })
      .beforeEachResponse((component, _, i) => {
        if (i !== 0) {
          const select = component.get('#submission-filters-submitter select');
          select.element.value.should.equal('');
        }
      })
      .afterResponses(component => {
        const select = component.get('#submission-filters-submitter select');
        select.element.value.should.equal(id);
      });
  });

  describe('modelValue prop is an unknown submitter', () => {
    it('renders correctly if submitters were loaded', () => {
      const component = mountComponent({
        props: { modelValue: '42' }
      });
      const option = component.get('option[value="42"]');
      option.text().should.equal('Unknown submitter');
    });

    it('renders correctly if there was an error loading submitters', () => {
      const component = mount(SubmissionFiltersSubmitter, {
        props: { modelValue: '42' },
        // !submitters.dataExists and also !submitters.awaitingResponse, meaning
        // that there was an error response.
        container: { requestData: testRequestData(['submitters']) }
      });
      const option = component.get('option[value="42"]');
      option.text().should.equal('Unknown submitter');
    });
  });

  it('updates value of select element after modelValue prop changes', async () => {
    const id = testData.extendedFieldKeys.createPast(1).last().id.toString();
    const component = mountComponent();
    await component.setProps({ modelValue: id });
    component.get('select').element.value.should.equal(id);
  });

  it('updates value of select after prop changes to unknown submitter', async () => {
    testData.extendedFieldKeys.createPast(1);
    const component = mountComponent();
    await component.setProps({ modelValue: '42' });
    component.get('select').element.value.should.equal('42');
  });

  it('emits an update:modelValue event', () => {
    const { id } = testData.extendedFieldKeys
      .createPast(1, 'App User 1')
      .last();
    const component = mountComponent();
    component.get('select').setValue(id.toString());
    component.emitted('update:modelValue').should.eql([[id.toString()]]);
  });
});
