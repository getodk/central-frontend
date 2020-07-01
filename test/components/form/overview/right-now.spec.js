import FormOverviewRightNow from '../../../../src/components/form/overview/right-now.vue';
import FormVersionSummaryItem from '../../../../src/components/form-version/summary-item.vue';
import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';

describe('FormOverviewRightNow', () => {
  beforeEach(mockLogin);

  it('renders FormVersionSummaryItem for the primary version', () => {
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { version: 'v2', draft: true });
    return load('/projects/1/forms/f').then(app => {
      const component = app
        .first(FormOverviewRightNow)
        .first(FormVersionSummaryItem);
      component.getProp('version').version.should.equal('v1');
    });
  });

  describe('form state', () => {
    it('renders correctly if the form is open', () => {
      testData.extendedForms.createPast(1, { state: 'open' });
      return load('/projects/1/forms/f').then(app => {
        const items = app.find('.summary-item');
        items.length.should.equal(3);
        const item = items[1];
        item.find('.icon-exchange').length.should.equal(1);
        item.first('.summary-item-heading').text().trim().should.equal('Open');
        item.first('.summary-item-body').text().trim().should.equal('This Form is downloadable and is accepting Submissions.');
      });
    });

    it('renders correctly if the form is closing', () => {
      testData.extendedForms.createPast(1, { state: 'closing' });
      return load('/projects/1/forms/f').then(app => {
        const item = app.find('.summary-item')[1];
        item.find('.icon-clock-o').length.should.equal(1);
        item.first('.summary-item-heading').text().trim().should.equal('Closing');
        item.first('.summary-item-body').text().trim().should.equal('This Form is not downloadable but still accepts Submissions.');
      });
    });

    it('renders correctly if the form is closed', () => {
      testData.extendedForms.createPast(1, { state: 'closed' });
      return load('/projects/1/forms/f').then(app => {
        const item = app.find('.summary-item')[1];
        item.find('.icon-lock').length.should.equal(1);
        item.first('.summary-item-heading').text().trim().should.equal('Closed');
        item.first('.summary-item-body').text().trim().should.equal('This Form is not downloadable and does not accept Submissions.');
      });
    });
  });

  describe('submissions', () => {
    it('shows the count', () => {
      testData.extendedForms.createPast(1, { submissions: 123 });
      return load('/projects/1/forms/f').then(app => {
        const items = app.find('.summary-item');
        items.length.should.equal(3);
        const item = items[2];
        item.first('.summary-item-heading').text().trim().should.equal('123');
        item.first('.summary-item-body').text().should.containEql('Submissions have');
      });
    });

    const targets = [
      ['icon', '.summary-item-icon-container'],
      ['count', '.summary-item-heading a'],
      ['caption', '.summary-item-body a']
    ];
    for (const [description, selector] of targets) {
      it(`renders a link for the ${description}`, () => {
        testData.extendedForms.createPast(1);
        return load('/projects/1/forms/f').then(app => {
          const items = app.find('.summary-item');
          items.length.should.equal(3);
          const href = items[2].first(selector).getAttribute('href');
          href.should.equal('#/projects/1/forms/f/submissions');
        });
      });
    }
  });
});
