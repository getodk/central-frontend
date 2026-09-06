import ProjectSubmissionOptions from '../../../src/components/project/submission-options.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FieldKeyList', () => {
  beforeEach(mockLogin);

  it('toggles the "Submission Options" modal', () => {
    testData.extendedProjects.createPast(1);
    return load('/projects/1/app-users').testModalToggles({
      modal: ProjectSubmissionOptions,
      show: '.heading-with-button a[href="#"]',
      hide: '.btn-primary'
    });
  });

  it('shows a message if there are no app users', () => {
    testData.extendedProjects.createPast(1, { appUsers: 0 });
    return load('/projects/1/app-users').then(app => {
      app.get('.empty-table-message').should.be.visible();
    });
  });

  describe('custom properties filter', () => {
    it('does not show the filter bar when there are no actor properties', () => {
      testData.extendedProjects.createPast(1, { appUsers: 1 });
      testData.extendedFieldKeys.createPast(1);
      return load('/projects/1/app-users').then(app => {
        app.find('#field-key-filter-bar').exists().should.be.false;
      });
    });

    it('shows the filter bar when there are actor properties', () => {
      testData.extendedProjects.createPast(1, { appUsers: 1 });
      testData.extendedFieldKeys.createPast(1);
      testData.actorProperties.createPast(1, { name: 'region' });
      return load('/projects/1/app-users').then(app => {
        app.get('#field-key-filter-bar').should.be.visible();
      });
    });

    it('shows all app users when no filter is active', () => {
      testData.extendedProjects.createPast(1, { appUsers: 2 });
      testData.extendedFieldKeys
        .createPast(1, { displayName: 'App User 1', properties: { region: 'North' } })
        .createPast(1, { displayName: 'App User 2', properties: { region: 'South' } });
      testData.actorProperties.createPast(1, { name: 'region' });
      return load('/projects/1/app-users').then(app => {
        app.findAll('.field-key-row').length.should.equal(2);
      });
    });

    it('shows only matching app users after a filter is applied', async () => {
      testData.extendedProjects.createPast(1, { appUsers: 2 });
      testData.extendedFieldKeys
        .createPast(1, { displayName: 'App User 1', properties: { region: 'North' } })
        .createPast(1, { displayName: 'App User 2', properties: { region: 'South' } });
      testData.actorProperties.createPast(1, { name: 'region' });
      const app = await load('/projects/1/app-users');
      await app.get('.custom-props-filter .dropdown-trigger').trigger('click');
      await app.get('.property-select').setValue('region');
      await app.get('.value-select').setValue('North');
      await app.get('.apply-btn').trigger('click');
      app.findAll('.field-key-row').length.should.equal(1);
      app.get('.field-key-row .display-name').text().should.equal('App User 1');
    });
  });
});
