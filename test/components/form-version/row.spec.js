import DateTime from '../../../src/components/date-time.vue';
import FormVersionRow from '../../../src/components/form-version/row.vue';
import FormVersionStandardButtons from '../../../src/components/form-version/standard-buttons.vue';
import TimeAndUser from '../../../src/components/time-and-user.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormVersionRow', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice' });
  });

  describe('version string', () => {
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

  describe('published', () => {
    it('shows publishedAt', () => {
      const form = testData.extendedForms.createPast(1).last();
      return load('/projects/1/forms/f/versions').then(app => {
        const dateTime = app.first(FormVersionRow).first(DateTime);
        dateTime.getProp('iso').should.equal(form.publishedAt);
      });
    });

    it('shows publishedBy', () => {
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f/versions').then(app => {
        const component = app.first(FormVersionRow).first(TimeAndUser);
        const user = component.getProp('user');
        user.id.should.equal(testData.extendedUsers.first().id);
        user.displayName.should.equal('Alice');
      });
    });
  });

  it('shows standard form definition buttons', () => {
    testData.extendedForms.createPast(1);
    return load('/projects/1/forms/f/versions').then(app => {
      const row = app.first(FormVersionRow);
      row.find(FormVersionStandardButtons).length.should.equal(1);
    });
  });
});
