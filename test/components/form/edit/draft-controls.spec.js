import FormEditDraftControls from '../../../../src/components/form/edit/draft-controls.vue';

import testData from '../../../data';
import { mount } from '../../../util/lifecycle';

const mountComponent = () => mount(FormEditDraftControls, {
  container: {
    requestData: { form: testData.extendedForms.last() }
  }
});

describe('FormEditDraftControls', () => {
  it('shows a "Delete Form" button if the form is a draft', () => {
    testData.extendedForms.createPast(1, { draft: true });
    const text = mountComponent().get('#form-edit-abandon-button').text();
    text.should.equal('Delete Form');
  });

  it('shows an "Abandon Form" button if the form is published', () => {
    testData.extendedForms.createPast(1);
    const text = mountComponent().get('#form-edit-abandon-button').text();
    text.should.equal('Abandon Draft');
  });
});
