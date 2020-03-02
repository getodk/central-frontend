import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormOverview', () => {
  beforeEach(mockLogin);

  describe('draft section', () => {
    describe('draft exists', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1, { version: 'v1' });
        testData.extendedFormVersions.createPast(1, {
          version: 'v2',
          draft: true
        });
      });

      it('shows the correct title', () =>
        load('/projects/1/forms/f').then(app => {
          const section = app.first('#form-overview-draft');
          const text = section.first('.page-section-heading span').text().trim();
          text.should.equal('Your Current Draft');
        }));

      it('shows the version string of the draft', () =>
        load('/projects/1/forms/f').then(app => {
          const section = app.first('#form-overview-draft');
          const text = section.first('.form-version-summary-item-version').text().trim();
          text.should.equal('v2');
        }));

      // TODO
      describe('draft checklist', () => {
        it('shows a shorter checklist');
        it('links to .../draft/status');
      });
    });

    it('shows the correct title if there is no draft', () => {
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f').then(app => {
        const section = app.first('#form-overview-draft');
        const text = section.first('.page-section-heading span').text().trim();
        text.should.equal('No Current Draft');
      });
    });
  });
});
