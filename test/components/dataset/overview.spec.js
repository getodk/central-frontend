import { RouterLinkStub } from '@vue/test-utils';
import { mount } from '../../util/lifecycle';

import DatasetOverview from '../../../src/components/dataset/overview.vue';
import ExpandableRow from '../../../src/components/expandable-row.vue';
import testData from '../../data';

const mountComponent = () => mount(DatasetOverview, {
  container: {
    requestData: {
      dataset: testData.extendedDatasets.last(),
      project: testData.extendedProjects.first()
    }
  },
  global: {
    stubs: { RouterLink: RouterLinkStub }
  }
});

describe('DatasetOverview', () => {
  describe('Creation Form Table', () => {
    it('shows the creation forms with associated properties', () => {
      testData.extendedDatasets.createPast(1, {
        name: 'trees', properties: [
          {
            name: 'height', forms: [
              { name: 'Tree Registration', xmlFormId: 'tree_registration' },
              { name: 'Tree Registration Adv', xmlFormId: 'tree_registration_adv' }
            ]
          },
          { name: 'circumference', forms: [{ name: 'Tree Registration Adv', xmlFormId: 'tree_registration_adv' }] },
          {
            name: 'type', forms: [
              { name: 'Tree Registration', xmlFormId: 'tree_registration' },
              { name: 'Tree Registration Adv', xmlFormId: 'tree_registration_adv' }
            ]
          }
        ]
      });
      const component = mountComponent();
      const creationFormsSection = component.get('.creation-forms');
      creationFormsSection.get('.summary-item-heading').text().should.be.equal('2');

      const rows = creationFormsSection.findAllComponents(ExpandableRow);


      rows[0].get('.expandable-row a').text().should.be.eql('Tree Registration');
      rows[0].get('.expandable-row .caption-cell').text().should.be.eql('2 of 3 properties');
      rows[0].get('.expanded-row').text().should.be.eql('height, type');

      rows[1].get('.expandable-row a').text().should.be.eql('Tree Registration Adv');
      rows[1].get('.expandable-row .caption-cell').text().should.be.eql('3 of 3 properties');
      rows[1].get('.expanded-row').text().should.be.eql('height, circumference, type');
    });

    it('does not break if there is no properties', () => {
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      const component = mountComponent();
      const creationFormsSection = component.get('.creation-forms');
      creationFormsSection.get('.summary-item-heading').text().should.be.equal('0');
    });

    it('does not break if there is no form for a property', () => {
      testData.extendedDatasets.createPast(1, {
        name: 'trees', properties: [
          { name: 'height', forms: [] }]
      });
      const component = mountComponent();
      const creationFormsSection = component.get('.creation-forms');
      creationFormsSection.get('.summary-item-heading').text().should.be.equal('0');
    });
  });

  describe('Linked Form Table', () => {
    it('shows the linked forms', () => {
      testData.extendedDatasets.createPast(1, {
        name: 'trees', linkedForms: [
          { name: 'Diagnosis', xmlFormId: 'monthly_diagnosis' },
          { name: 'National Parks Survey', xmlFormId: 'national_parks_survey' }
        ]
      });
      const component = mountComponent();
      const linkedFormsSection = component.get('.linked-forms');
      linkedFormsSection.get('.summary-item-heading').text().should.be.equal('2');

      const rows = linkedFormsSection.findAll('tr');

      rows[0].text().should.be.eql('Diagnosis');
      rows[1].text().should.be.eql('National Parks Survey');
    });

    it('does not break if there is no form', () => {
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      const component = mountComponent();
      const linkedFormsSection = component.get('.linked-forms');
      linkedFormsSection.get('.summary-item-heading').text().should.be.equal('0');
    });
  });

  describe('Dataset Properties', () => {
    it('shows the properties with their forms', () => {
      testData.extendedDatasets.createPast(1, {
        name: 'trees', properties: [
          {
            name: 'height', forms: [
              { name: 'Tree Registration', xmlFormId: 'tree_registration' },
              { name: 'Tree Registration Adv', xmlFormId: 'tree_registration_adv' }
            ]
          },
          { name: 'circumference', forms: [{ name: 'Tree Registration Adv', xmlFormId: 'tree_registration_adv' }] },
          {
            name: 'type', forms: [
              { name: 'Tree Registration', xmlFormId: 'tree_registration' },
              { name: 'Tree Registration Adv', xmlFormId: 'tree_registration_adv' }
            ]
          }
        ]
      });
      const component = mountComponent();
      const rows = component.findAll('#dataset-overview-properties tbody tr');

      rows.length.should.be.eql(5);

      rows[0].findAll('td')[0].text().should.be.eql('height');
      rows[0].findAll('td')[1].text().should.be.eql('Tree Registration');
      rows[1].findAll('td')[0].text().should.be.eql('Tree Registration Adv');

      rows[2].findAll('td')[0].text().should.be.eql('circumference');
      rows[2].findAll('td')[1].text().should.be.eql('Tree Registration Adv');

      rows[3].findAll('td')[0].text().should.be.eql('type');
      rows[3].findAll('td')[1].text().should.be.eql('Tree Registration');
      rows[4].findAll('td')[0].text().should.be.eql('Tree Registration Adv');
    });

    it('does not break if there is no form for a property', () => {
      testData.extendedDatasets.createPast(1, {
        name: 'trees', properties: [
          { name: 'height', forms: [] }
        ]
      });
      const component = mountComponent();
      const rows = component.findAll('#dataset-overview-properties tbody tr');

      rows.length.should.be.eql(1);
      rows[0].findAll('td')[0].text().should.be.eql('height');
      rows[0].findAll('td')[1].text().should.be.eql('');
    });
  });
});
