import { nextTick } from 'vue';

import ConnectionToForms from '../../../../src/components/dataset/overview/connection-to-forms.vue';
import ExpandableRow from '../../../../src/components/expandable-row.vue';
import FormLink from '../../../../src/components/form/link.vue';

import testData from '../../../data';
import { mockRouter } from '../../../util/router';
import { mount } from '../../../util/lifecycle';

const mountComponent = () => mount(ConnectionToForms, {
  container: {
    router: mockRouter('/'),
    requestData: { dataset: testData.extendedDatasets.last() }
  }
});

describe('ConnectionToForms', () => {
  it('shows the creation forms with associated properties', async () => {
    testData.extendedDatasets.createPast(1, {
      name: 'trees',
      properties: [
        {
          name: 'height',
          forms: [
            { name: 'Tree Registration', xmlFormId: 'tree_registration' },
            { name: 'Tree Registration Adv', xmlFormId: 'tree_registration_adv' }
          ]
        },
        {
          name: 'circumference',
          forms: [
            { name: 'Tree Registration Adv', xmlFormId: 'tree_registration_adv' }
          ]
        },
        {
          name: 'type',
          forms: [
            { name: 'Tree Registration', xmlFormId: 'tree_registration' },
            { name: 'Tree Registration Adv', xmlFormId: 'tree_registration_adv' }
          ]
        }
      ],
      sourceForms: [
        { name: 'Tree Registration', xmlFormId: 'tree_registration' },
        { name: 'Tree Registration Adv', xmlFormId: 'tree_registration_adv' },
        { name: 'Form with no properties', xmlFormId: 'form_with_no_prop' }
      ]
    });
    const component = mountComponent();
    // Wait for I18nList to finish rendering.
    await nextTick();

    component.get('#connection-to-forms-heading').text().should.be.equal('3 Forms updating Entities');

    const rows = component.findAllComponents(ExpandableRow);

    rows[0].get('.expandable-row-title').text().should.be.eql('Tree Registration');
    rows[0].get('.caption-cell').text().should.be.eql('2 of 3 properties');
    rows[0].get('.expanded-row').text().should.be.eql('height, type');
    rows[0].getComponent(FormLink).props().to.should.be.equal('/projects/1/forms/tree_registration/submissions');

    rows[1].get('.expandable-row-title').text().should.be.eql('Tree Registration Adv');
    rows[1].get('.caption-cell').text().should.be.eql('3 of 3 properties');
    rows[1].get('.expanded-row').text().should.be.eql('height, circumference, type');
    rows[1].getComponent(FormLink).props().to.should.be.equal('/projects/1/forms/tree_registration_adv/submissions');

    rows[2].get('.expandable-row-title').text().should.be.eql('Form with no properties');
    rows[2].get('.caption-cell').text().should.be.eql('0 of 3 properties');
    rows[2].get('.expanded-row').text().should.be.eql('This Form only sets the “label”.');
    rows[2].getComponent(FormLink).props().to.should.be.equal('/projects/1/forms/form_with_no_prop/submissions');
  });

  it('does not break if there is no forms', () => {
    testData.extendedDatasets.createPast(1, { name: 'trees' });
    const component = mountComponent();
    component.get('#connection-to-forms-heading').text().should.be.equal('0 Forms updating Entities');
  });

  it('does not break if there is no form for a property', () => {
    testData.extendedDatasets.createPast(1, {
      name: 'trees',
      properties: [{ name: 'height', forms: [] }]
    });
    const component = mountComponent();
    component.get('#connection-to-forms-heading').text().should.be.equal('0 Forms updating Entities');
  });

  it('shows repeat indicator pill for source forms where dataset came from repeat group', () => {
    testData.extendedDatasets.createPast(1, {
      name: 'trees',
      properties: [],
      sourceForms: [
        { name: 'Tree Registration', xmlFormId: 'tree_registration', repeatPath: '/farm/plot/trees/' },
        { name: 'Form with no properties', xmlFormId: 'form_with_no_prop' }
      ]
    });
    const component = mountComponent();

    const rows = component.findAllComponents(ExpandableRow);
    // Pill text is the last part of the repeat path
    rows[0].get('.repeat-tag').text().should.be.eql('trees');

    // No pill on  form where dataset is not from repeat
    rows[1].find('.repeat-tag').exists().should.be.false;
  });

  it('shows repeat indicator pill with full path as tooltip', async () => {
    testData.extendedDatasets.createPast(1, {
      name: 'trees',
      properties: [],
      sourceForms: [
        { name: 'Tree Registration', xmlFormId: 'tree_registration', repeatPath: '/farm/plot/trees/' }
      ]
    });
    const component = mountComponent();

    const row = component.findAllComponents(ExpandableRow)[0];

    await row.get('.repeat-tag').should.have.tooltip('/farm/plot/trees/');
  });
});
