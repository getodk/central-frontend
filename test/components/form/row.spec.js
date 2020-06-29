import DateTime from '../../../src/components/date-time.vue';
import FormRow from '../../../src/components/form/row.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormRow', () => {
  describe('form name and xmlFormId', () => {
    beforeEach(mockLogin);

    it('renders the name and xmlFormId if the form has a name', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f', name: 'My Form' });
      return load('/projects/1').then(app => {
        const td = app.first('td');
        td.first('.form-row-name').text().trim().should.equal('My Form');
        td.first('.form-row-form-id').text().trim().should.equal('f');
      });
    });

    it('renders the xmlFormId if the form does not have a name', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f', name: null });
      return load('/projects/1').then(app => {
        const td = app.first('td');
        td.first('.form-row-name').text().trim().should.equal('f');
        td.find('.form-row-form-id').length.should.equal(0);
      });
    });
  });

  describe('link', () => {
    describe('administrator', () => {
      beforeEach(mockLogin);

      it('links to form overview for a form with a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
        return load('/projects/1').then(app => {
          const href = app.first('.form-row-name').getAttribute('href');
          href.should.equal('#/projects/1/forms/a%20b');
        });
      });

      it('links to .../draft for a form without a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
        return load('/projects/1').then(app => {
          const href = app.first('.form-row-name').getAttribute('href');
          href.should.equal('#/projects/1/forms/a%20b/draft');
        });
      });
    });

    describe('project viewer', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      });

      it('links to .../submissions for a form with a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
        return load('/projects/1').then(app => {
          const href = app.first('.form-row-name').getAttribute('href');
          href.should.equal('#/projects/1/forms/a%20b/submissions');
        });
      });

      it('links to .../draft/testing for a form without a published version', () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
        return load('/projects/1').then(app => {
          const href = app.first('.form-row-name').getAttribute('href');
          href.should.equal('#/projects/1/forms/a%20b/draft/testing');
        });
      });
    });
  });

  it('shows the submission count', () => {
    mockLogin();
    testData.extendedForms.createPast(1, { submissions: 12345 });
    return load('/projects/1').then(app => {
      const text = app.first('.form-row-submissions').text().trim();
      text.should.equal('12,345 Submissions');
    });
  });

  it('shows the name of the creating user', () => {
    mockLogin({ displayName: 'Alice' });
    testData.extendedForms.createPast(1);
    return load('/projects/1').then(app => {
      app.find('td')[1].text().trim().should.equal('Alice');
    });
  });

  it('shows publishedAt', () => {
    mockLogin();
    const { publishedAt } = testData.extendedForms.createPast(1).last();
    return load('/projects/1').then(app => {
      const row = app.first(FormRow);
      row.first(DateTime).getProp('iso').should.equal(publishedAt);
    });
  });

  describe('last submission date', () => {
    beforeEach(mockLogin);

    it('shows the date', () => {
      const now = new Date().toISOString();
      testData.extendedProjects.createPast(1, {
        forms: 1,
        lastSubmission: now
      });
      testData.extendedForms.createPast(1, {
        submissions: 1,
        lastSubmission: now
      });
      return load('/projects/1').then(app => {
        app.first(FormRow).find(DateTime)[1].getProp('iso').should.equal(now);
      });
    });

    it('is empty if there has been no submission', () => {
      testData.extendedForms.createPast(1);
      return load('/projects/1').then(app => {
        app.find('td')[3].text().trim().should.equal('');
      });
    });
  });
});
