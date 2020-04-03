import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';

describe('ProjectFormAccessRow', () => {
  beforeEach(mockLogin);

  describe('form name and xmlFormId', () => {
    it("shows the form's name if the form has one", () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f', name: 'My Form' });
      return load('/projects/1/form-access').then(app => {
        const a = app.first('.project-form-access-row-form-name a');
        a.text().trim().should.equal('My Form');
        a.getAttribute('title').should.equal('My Form');
      });
    });

    it('shows the xmlFormId if the form does not have a name', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f', name: null });
      return load('/projects/1/form-access').then(app => {
        const a = app.first('.project-form-access-row-form-name a');
        a.text().trim().should.equal('f');
        a.getAttribute('title').should.equal('f');
      });
    });
  });

  describe('form link', () => {
    it('links to the form overview for a form with a published version', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
      return load('/projects/1/form-access').then(app => {
        const a = app.first('.project-form-access-row-form-name a');
        a.getAttribute('href').should.equal('#/projects/1/forms/a%20b');
      });
    });

    it('links to .../draft for a form without a published version', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
      return load('/projects/1/form-access').then(app => {
        const a = app.first('.project-form-access-row-form-name a');
        const href = a.getAttribute('href');
        href.should.equal('#/projects/1/forms/a%20b/draft');
      });
    });
  });

  describe('form state', () => {
    it('shows the form state', () => {
      testData.extendedForms.createPast(1, { state: 'closing' });
      return load('/projects/1/form-access').then(app => {
        const td = app.find('.project-form-access-row td')[1];
        td.first('select').element.value.should.equal('closing');
      });
    });

    it('shows an icon for a form without a published version', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return load('/projects/1/form-access').then(app => {
        const td = app.find('.project-form-access-row td')[1];
        td.first('.icon-edit').should.be.visible();
      });
    });
  });

  describe('app user access', () => {
    it('shows app user access', () => {
      testData.extendedProjects.createPast(1, { forms: 1, appUsers: 2 });
      testData.extendedForms.createPast(1, { xmlFormId: 'f' });
      testData.extendedFieldKeys.createPast(2);
      // Create an assignment for the second field key, which will be the first
      // field key shown in the table.
      testData.standardFormSummaryAssignments.createPast(1, {
        actorId: testData.extendedFieldKeys.last().id,
        role: 'app-user',
        xmlFormId: 'f'
      });
      return load('/projects/1/form-access').then(app => {
        const td = app.find('.project-form-access-row-access');
        td.length.should.equal(2);
        td[0].first('input').element.checked.should.be.true();
        td[1].first('input').element.checked.should.be.false();
      });
    });

    it('does not show an app user without a token', () => {
      testData.extendedProjects.createPast(1, { forms: 1, appUsers: 1 });
      testData.extendedForms.createPast(1, { xmlFormId: 'f' });
      testData.extendedFieldKeys.createPast(1, { token: null });
      testData.standardFormSummaryAssignments.createPast(1, {
        actorId: testData.extendedFieldKeys.last().id,
        role: 'app-user',
        xmlFormId: 'f'
      });
      return load('/projects/1/form-access').then(app => {
        app.find('.project-form-access-row-access').length.should.equal(0);
      });
    });
  });
});
