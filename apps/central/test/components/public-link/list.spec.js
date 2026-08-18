import ProjectSubmissionOptions from '../../../src/components/project/submission-options.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('PublicLinkList', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedForms.createPast(1);
  });

  it('toggles the "Submission Options" modal', () =>
    load('/projects/1/forms/f/public-links').testModalToggles({
      modal: ProjectSubmissionOptions,
      show: '.heading-with-button a[href="#"]',
      hide: '.btn-primary'
    }));

  it('shows a message if there are no public links', async () => {
    const component = await load('/projects/1/forms/f/public-links');
    component.get('.empty-table-message').should.be.visible();
  });

  describe('custom properties filter', () => {
    it('does not show the filter bar when there are no actor properties', () => {
      testData.extendedPublicLinks.createPast(1);
      return load('/projects/1/forms/f/public-links').then(app => {
        app.find('#public-link-filter-bar').exists().should.be.false;
      });
    });

    it('shows the filter bar when there are actor properties', () => {
      testData.extendedPublicLinks.createPast(1);
      testData.actorProperties.createPast(1, { name: 'region' });
      return load('/projects/1/forms/f/public-links').then(app => {
        app.get('#public-link-filter-bar').should.be.visible();
      });
    });

    it('shows all public links when no filter is active', () => {
      testData.extendedPublicLinks
        .createPast(1, { displayName: 'Link 1', properties: { region: 'North' } })
        .createPast(1, { displayName: 'Link 2', properties: { region: 'South' } });
      testData.actorProperties.createPast(1, { name: 'region' });
      return load('/projects/1/forms/f/public-links').then(app => {
        app.findAll('.public-link-row').length.should.equal(2);
      });
    });

    it('shows only matching public links after a filter is applied', async () => {
      testData.extendedPublicLinks
        .createPast(1, { displayName: 'Link 1', properties: { region: 'North' } })
        .createPast(1, { displayName: 'Link 2', properties: { region: 'South' } });
      testData.actorProperties.createPast(1, { name: 'region' });
      const app = await load('/projects/1/forms/f/public-links');
      await app.get('.custom-props-filter .dropdown-trigger').trigger('click');
      await app.get('.property-select').setValue('region');
      await app.get('.value-select').setValue('North');
      await app.get('.apply-btn').trigger('click');
      app.findAll('.public-link-row').length.should.equal(1);
      app.get('.public-link-row .display-name').text().should.equal('Link 1');
    });
  });
});
