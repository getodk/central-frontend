import FormLink from '../../../../src/components/form/link.vue';
import LinkedForms from '../../../../src/components/dataset/overview/linked-forms.vue';

import testData from '../../../data';
import { mockRouter } from '../../../util/router';
import { mount } from '../../../util/lifecycle';

const mountComponent = () => mount(LinkedForms, {
  container: {
    router: mockRouter('/'),
    requestData: { dataset: testData.extendedDatasets.last() }
  }
});

describe('LinkedForms', () => {
  it('shows the linked forms', () => {
    testData.extendedDatasets.createPast(1, {
      name: 'trees', linkedForms: [
        { name: 'Diagnosis', xmlFormId: 'monthly_diagnosis' },
        { name: 'National Parks Survey', xmlFormId: 'national_parks_survey' }
      ]
    });
    const component = mountComponent();
    component.get('#linked-forms-heading').text().should.be.equal('2 Forms use this Entity List');

    const rows = component.findAll('tr');

    rows[0].text().should.be.eql('Diagnosis');
    rows[0].getComponent(FormLink).props().to.should.be.equal('/projects/1/forms/monthly_diagnosis/submissions');

    rows[1].text().should.be.eql('National Parks Survey');
    rows[1].getComponent(FormLink).props().to.should.be.equal('/projects/1/forms/national_parks_survey/submissions');
  });

  it('does not break if there is no form', () => {
    testData.extendedDatasets.createPast(1, { name: 'trees' });
    const component = mountComponent();
    component.get('#linked-forms-heading').text().should.be.equal('0 Forms use this Entity List');
  });
});
