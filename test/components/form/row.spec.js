import DateTime from '../../../src/components/date-time.vue';
import EnketoFill from '../../../src/components/enketo/fill.vue';
import EnketoPreview from '../../../src/components/enketo/preview.vue';
import FormRow from '../../../src/components/form/row.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormRow', () => {
  describe('form name', () => {
    beforeEach(mockLogin);

    it("shows the form's name if it has one", async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f', name: 'My Form' });
      const app = await load('/projects/1');
      app.first('.form-row .name').text().trim().should.equal('My Form');
    });

    it('shows the xmlFormId if the form does not have a name', async () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f', name: null });
      const app = await load('/projects/1');
      app.first('.form-row .name').text().trim().should.equal('f');
    });
  });

  describe('form link', () => {
    describe('administrator', () => {
      beforeEach(mockLogin);

      it('links to form overview for a form with a published version', async () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
        const app = await load('/projects/1');
        const href = app.first('.form-row .name a').getAttribute('href');
        href.should.equal('#/projects/1/forms/a%20b');
      });

      it('links to .../draft for a form without a published version', async () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
        const app = await load('/projects/1');
        const href = app.first('.form-row .name a').getAttribute('href');
        href.should.equal('#/projects/1/forms/a%20b/draft');
      });
    });

    describe('project viewer', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      });

      it('links to .../submissions for a form with a published version', async () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
        const app = await load('/projects/1');
        const href = app.first('.form-row .name a').getAttribute('href');
        href.should.equal('#/projects/1/forms/a%20b/submissions');
      });

      it('links to .../draft/testing for form without published version', async () => {
        testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
        const app = await load('/projects/1');
        const href = app.first('.form-row .name a').getAttribute('href');
        href.should.equal('#/projects/1/forms/a%20b/draft/testing');
      });
    });

    describe('Data Collector', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        testData.extendedProjects.createPast(1, { role: 'formfill', forms: 1 });
        testData.extendedForms.createPast(1, { name: 'My Form' });
      });

      it('does not render a link', async () => {
        const app = await load('/projects/1');
        const name = app.first('.form-row .name');
        name.find('a').length.should.equal(0);
        name.text().trim().should.equal('My Form');
      });
    });
  });

  it('shows the xmlFormId', async () => {
    mockLogin();
    testData.extendedForms.createPast(1, { xmlFormId: 'f' });
    const app = await load('/projects/1');
    app.first('.form-row .form-id').text().trim().should.equal('f');
  });

  describe('version string', () => {
    beforeEach(mockLogin);

    it('shows the version string', async () => {
      testData.extendedForms.createPast(1, { version: 'v1' });
      const app = await load('/projects/1');
      app.first('.form-row .version').text().trim().should.equal('v1');
    });

    it('does not render the version string if it is empty', async () => {
      testData.extendedForms.createPast(1, { version: '' });
      const app = await load('/projects/1');
      app.find('.form-row .version').length.should.equal(0);
    });

    it('does not render version string for form without published version', async () => {
      testData.extendedForms.createPast(1, { draft: true, version: 'v1' });
      const app = await load('/projects/1');
      app.find('.form-row .version').length.should.equal(0);
    });
  });

  it('shows the submission count', async () => {
    mockLogin();
    testData.extendedForms.createPast(1, { submissions: 12345 });
    const app = await load('/projects/1');
    const text = app.first('.form-row .submissions div').text().trim();
    text.should.equal('12,345 Submissions');
  });

  describe('last submission date', () => {
    beforeEach(mockLogin);

    it('shows the date', async () => {
      const lastSubmission = new Date().toISOString();
      testData.extendedForms.createPast(1, { lastSubmission });
      const app = await load('/projects/1');
      const row = app.first(FormRow);
      const divs = row.find('.submissions div');
      divs.length.should.equal(2);
      divs[1].text().trim().should.match(/^\(last .+\)$/);
      const dateTimes = row.find(DateTime);
      dateTimes.length.should.equal(1);
      dateTimes[0].getProp('iso').should.equal(lastSubmission);
    });

    it('does not render date if there have been no submissions', async () => {
      testData.extendedForms.createPast(1, { submissions: 0 });
      const app = await load('/projects/1');
      app.find('.form-row .submissions div').length.should.equal(1);
    });
  });

  describe('submissions link', () => {
    describe('administrator', () => {
      beforeEach(mockLogin);

      it('links to .../submissions for a form with a published version', async () => {
        testData.extendedForms.createPast(1, {
          xmlFormId: 'a b',
          submissions: 1
        });
        const app = await load('/projects/1');
        const href = app.find('.form-row .submissions a')
          .map(a => a.getAttribute('href'));
        href.length.should.equal(2);
        href.should.matchEach('#/projects/1/forms/a%20b/submissions');
      });

      it('links to .../draft/testing for form without published version', async () => {
        testData.extendedForms.createPast(1, {
          xmlFormId: 'a b',
          draft: true,
          submissions: 1
        });
        const app = await load('/projects/1');
        const a = app.find('.form-row .submissions a');
        // Since the form does not have a published version, it does not have a
        // lastSubmission property.
        a.length.should.equal(1);
        const href = a[0].getAttribute('href');
        href.should.equal('#/projects/1/forms/a%20b/draft/testing');
      });
    });

    describe('Data Collector', () => {
      beforeEach(() => {
        mockLogin({ role: 'none' });
        const lastSubmission = new Date().toISOString();
        testData.extendedProjects.createPast(1, {
          role: 'formfill',
          forms: 1,
          lastSubmission
        });
        testData.extendedForms.createPast(1, { lastSubmission });
      });

      it('does not render a link', async () => {
        const app = await load('/projects/1');
        const submissions = app.first('.form-row .submissions');
        submissions.find('a').length.should.equal(0);
        submissions.find('div').length.should.equal(2);
      });
    });
  });

  describe('actions', () => {
    it('shows the preview button to an administrator', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedForms.createPast(1);
      const app = await load('/projects/1');
      app.first(EnketoPreview).should.be.visible();
      app.find(EnketoFill).length.should.equal(0);
    });

    it('shows the "Fill Form" button to a Data Collector', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'formfill', forms: 1 });
      testData.extendedForms.createPast(1);
      const app = await load('/projects/1');
      app.first(EnketoFill).should.be.visible();
      app.find(EnketoPreview).length.should.equal(0);
    });
  });
});
