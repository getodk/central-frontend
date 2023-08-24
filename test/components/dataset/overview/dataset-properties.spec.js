/*
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

import { RouterLinkStub } from '@vue/test-utils';
import { mockRouter } from '../../../util/router';
import { mount } from '../../../util/lifecycle';

import DatasetProperties from '../../../../src/components/dataset/overview/dataset-properties.vue';
import testData from '../../../data';

const mountComponent = () => mount(DatasetProperties, {
  props: {
    properties: testData.extendedDatasets.last().properties,
    projectId: testData.extendedProjects.first().id.toString()
  },
  container: {
    router: mockRouter('/')
  }
});

describe('Dataset Properties', () => {
  it('shows the properties with their forms', () => {
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
      ]
    });
    const component = mountComponent();
    const rows = component.findAll('tbody tr');

    rows.length.should.be.eql(5);

    rows[0].findAll('td')[0].text().should.be.eql('height');
    rows[0].findAll('td')[1].text().should.be.eql('Tree Registration');
    rows[0].getComponent(RouterLinkStub).props().to.should.be.equal('/projects/1/forms/tree_registration');
    rows[1].findAll('td')[0].text().should.be.eql('Tree Registration Adv');
    rows[1].getComponent(RouterLinkStub).props().to.should.be.equal('/projects/1/forms/tree_registration_adv');

    rows[2].findAll('td')[0].text().should.be.eql('circumference');
    rows[2].findAll('td')[1].text().should.be.eql('Tree Registration Adv');
    rows[2].getComponent(RouterLinkStub).props().to.should.be.equal('/projects/1/forms/tree_registration_adv');

    rows[3].findAll('td')[0].text().should.be.eql('type');
    rows[3].findAll('td')[1].text().should.be.eql('Tree Registration');
    rows[3].getComponent(RouterLinkStub).props().to.should.be.equal('/projects/1/forms/tree_registration');
    rows[4].findAll('td')[0].text().should.be.eql('Tree Registration Adv');
    rows[4].getComponent(RouterLinkStub).props().to.should.be.equal('/projects/1/forms/tree_registration_adv');
  });

  it('shows the property even if there is no associated form', () => {
    testData.extendedDatasets.createPast(1, {
      name: 'trees',
      properties: [
        { name: 'height', forms: [] }
      ]
    });
    const component = mountComponent();
    const rows = component.findAll('tbody tr');

    rows.length.should.be.eql(1);
    rows[0].findAll('td')[0].text().should.be.eql('height');
    rows[0].findAll('td')[1].text().should.be.eql('');
  });

  it('shows empty message when there is no properties', () => {
    testData.extendedDatasets.createPast(1, {
      name: 'trees', properties: []
    });
    const component = mountComponent();
    component.text().should.be.eql('The Entities in this Entity List do not have any user-defined properties.');
  });
});
