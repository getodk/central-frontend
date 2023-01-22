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

import LinkedForms from '../../../../src/components/dataset/overview/linked-forms.vue';
import testData from '../../../data';

const mountComponent = () => mount(LinkedForms, {
  props: {
    linkedForms: testData.extendedDatasets.last().linkedForms,
    projectId: testData.extendedProjects.first().id.toString()
  },
  container: {
    router: mockRouter('/')
  }
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
    component.get('.summary-item-heading').text().should.be.equal('2');

    const rows = component.findAll('tr');

    rows[0].text().should.be.eql('Diagnosis');
    rows[0].getComponent(RouterLinkStub).props().to.should.be.equal('/projects/1/forms/monthly_diagnosis');
    rows[1].text().should.be.eql('National Parks Survey');
    rows[1].getComponent(RouterLinkStub).props().to.should.be.equal('/projects/1/forms/national_parks_survey');
  });

  it('does not break if there is no form', () => {
    testData.extendedDatasets.createPast(1, { name: 'trees' });
    const component = mountComponent();
    component.get('.summary-item-heading').text().should.be.equal('0');
  });
});
