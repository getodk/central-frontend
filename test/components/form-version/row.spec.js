import DateTime from '../../../src/components/date-time.vue';
import FormVersionRow from '../../../src/components/form-version/row.vue';
import FormVersionStandardButtons from '../../../src/components/form-version/standard-buttons.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormVersionRow', () => {
  describe('version string', () => {
    beforeEach(mockLogin);

    it('shows the version string', () => {
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f/versions').then(app => {
        const span = app.first('.form-version-row-version span');
        span.text().trim().should.equal('v1');
        span.getAttribute('title').should.equal('v1');
      });
    });

    it('shows (blank) if the version string is empty', () => {
      testData.extendedForms.createPast(1, { version: '' });
      return load('/projects/1/forms/f/versions').then(app => {
        const span = app.first('.form-version-row-version span');
        span.text().trim().should.equal('(blank)');
        span.getAttribute('title').should.equal('(blank)');
      });
    });
  });

  it('shows publishedAt', () => {
    mockLogin();
    const form = testData.extendedForms.createPast(1).last();
    return load('/projects/1/forms/f/versions').then(app => {
      const dateTime = app.first(FormVersionRow).first(DateTime);
      dateTime.getProp('iso').should.equal(form.publishedAt);
    });
  });

  describe('publishedBy', () => {
    it('renders a link for an administrator', () => {
      mockLogin({ displayName: 'Alice' });
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f/versions').then(app => {
        const div = app.first('.form-version-row-published-by');
        div.getAttribute('title').should.equal('Alice');
        const a = div.first('a');
        a.text().trim().should.equal('Alice');
        a.getAttribute('href').should.equal('#/users/1/edit');
      });
    });

    it('only shows text for a project manager', () => {
      mockLogin({ displayName: 'Bob', role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'manager', forms: 1 });
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f/versions').then(app => {
        const div = app.first('.form-version-row-published-by');
        div.find('a').length.should.equal(0);
        div.text().trim().should.equal('Bob');
        div.getAttribute('title').should.equal('Bob');
      });
    });
  });

  it('shows standard form definition buttons', () => {
    mockLogin();
    testData.extendedForms.createPast(1);
    return load('/projects/1/forms/f/versions').then(app => {
      const row = app.first(FormVersionRow);
      row.find(FormVersionStandardButtons).length.should.equal(1);
    });
  });
});
