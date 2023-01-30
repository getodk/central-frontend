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

import ExpandableRow from '../../src/components/expandable-row.vue';
import { mount } from '../util/lifecycle';

describe('ExpandableRow', () => {
  let component;

  beforeEach(() => {
    component = mount(ExpandableRow, {
      slots: {
        title: 'Trees Registration',
        caption: '2 of 10 properties',
        details: 'height, type'
      }
    });
  });

  it('shows title', () => {
    component.get('.title-cell').text().should.be.equal('Trees Registration');
  });

  it('shows caption', () => {
    component.get('.caption-cell').text().should.be.equal('2 of 10 properties');
  });

  it('is not expanded initially', () => {
    component.get('.expanded-row').should.be.hidden();
  });

  it('expands details', async () => {
    await component.get('.button-cell button').trigger('click');
    component.get('.expanded-row').should.be.visible();
    component.get('.expanded-row').text().should.be.eql('height, type');
  });

  it('collapses details', async () => {
    // expand
    await component.get('.button-cell button').trigger('click');
    component.get('.expanded-row').should.be.visible();
    component.get('.expanded-row').text().should.be.eql('height, type');

    // collapse
    await component.get('.button-cell button').trigger('click');
    component.get('.expanded-row').should.be.hidden();
  });
});
