import testData from '../../../data';
import { mockLogin } from '../../../session';
import { mockRoute } from '../../../http';

const loadOverview = (formOptions = {}) => {
  const form = testData.extendedForms.createPast(1, formOptions).last();
  return mockRoute(`/projects/1/forms/${encodeURIComponent(form.xmlFormId)}`)
    .respondWithData(() => testData.extendedProjects.last())
    .respondWithData(() => form)
    .respondWithData(() => testData.extendedFormAttachments.sorted());
};

describe('FormOverviewRightNow', () => {
  beforeEach(mockLogin);

  it('shows the form version', () =>
    loadOverview({ version: 'v1' }).afterResponses(app => {
      const span = app.first('#form-overview-right-now-version');
      span.text().trim().should.equal('v1');
      span.getAttribute('title').should.equal('v1');
    }));

  it('shows a button to view the XML', () =>
    loadOverview({ xmlFormId: 'f' }).afterResponses(app => {
      const btn = app.first('#form-overview-right-now .btn');
      btn.getAttribute('href').should.equal('/v1/projects/1/forms/f.xml');
    }));

  it('shows the submission count', () =>
    loadOverview({ submissions: 123 }).afterResponses(app => {
      const headings = app.find('.summary-item-heading');
      headings.length.should.equal(2);
      headings[1].text().trim().should.equal('123');
    }));

  const targets = [
    ['icon', '.summary-item-icon-container'],
    ['count', '.summary-item-heading a'],
    ['caption', '.summary-item-body a']
  ];
  for (const [description, selector] of targets) {
    it(`renders a link for the submissions ${description}`, () =>
      loadOverview({ xmlFormId: 'f' }).afterResponses(app => {
        const items = app.find('.summary-item');
        items.length.should.equal(2);
        const href = items[1].first(selector).getAttribute('href');
        href.should.equal('#/projects/1/forms/f/submissions');
      }));
  }
});
