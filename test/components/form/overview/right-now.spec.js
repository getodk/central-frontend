import testData from '../../../data';
import { mockLogin } from '../../../session';
import { mockRoute } from '../../../http';
import { trigger } from '../../../event';
import FormPreviewButton from '../../../../src/components/form/overview/right-now/preview-button.vue';

const loadOverview = (formOptions = {}) => {
  testData.extendedProjects.createPast(1, { appUsers: 1 });
  const form = testData.extendedForms.createPast(1, formOptions).last();
  return mockRoute(`/projects/1/forms/${encodeURIComponent(form.xmlFormId)}`)
    .respondWithData(() => testData.extendedProjects.last())
    .respondWithData(() => form)
    .respondWithData(() => testData.extendedFormAttachments.sorted())
    .respondWithData(() =>
      testData.extendedFieldKeys.createPast(1).sorted().map(testData.toActor));
};

describe('FormOverviewRightNow', () => {
  beforeEach(mockLogin);

  it('shows the form version', () =>
    loadOverview({ version: 'v1' }).afterResponses(app => {
      const span = app.first('#form-overview-right-now .form-version');
      span.text().trim().should.equal('v1');
      span.getAttribute('title').should.equal('v1');
    }));

  it('accounts for a blank form version', () =>
    loadOverview({ version: '' }).afterResponses(app => {
      const span = app.first('#form-overview-right-now .form-version');
      span.text().trim().should.equal('(blank)');
      span.getAttribute('title').should.equal('(blank)');
      span.hasClass('blank-form-version').should.be.true();
    }));

  describe('FormPreviewButton', () => {
    it('is visible', () =>
      loadOverview({ xmlFormId: 'f' }).afterResponses(app => {
        const btn = app.first('#form-preview-button');
        btn.text().trim().should.equal('Preview');
        btn.should.be.visible();
      }));

    it('implements some standard button things', () =>
      loadOverview({ xmlFormId: 'f' })
        .afterResponses(() => {})
        .request(component => trigger.click(component, '#form-preview-button'))
        .standardButton('#form-preview-button'));

    it('has the correct preview path', () =>
      loadOverview({ xmlFormId: 'f' }).afterResponses(app => {
        const component = app.first(FormPreviewButton);
        component.vm.previewPath.should.equal('/projects/1/forms/f/preview');
      }));

    it('opens a new tab when clicked', () => {
      const fakePreviewUrl = 'http://some/plausible/url';
      const realWindowOpen = window.open;
      let newTabUrl;
      // This seems evil… is there a better way?
      window.open = () => ({ location: { replace: (finalUrl) => { newTabUrl = finalUrl; } } });
      return loadOverview({ xmlFormId: 'f' })
        .afterResponses(() => {})
        .request(app => {
          trigger.click(app, '#form-preview-button');
        })
        .respondWithData(() => ({ preview_url: fakePreviewUrl }))
        // This passes when it should, but is there any guarantee that the window.open() call
        // happens before afterResponses()?
        .afterResponses(() => newTabUrl.should.equal(fakePreviewUrl))
        .finally(() => { window.open = realWindowOpen; });
    });

    it('shows an alert when the preview URL is invalid', () =>
      loadOverview({ xmlFormId: 'f' })
        .afterResponses(() => {})
        .request(app => {
          trigger.click(app, '#form-preview-button');
        })
        .respondWithData(() => ({ preview_url: 'total garbage' }))
        .afterResponses((app) => app.should.alert('danger')));
  });

  it('shows a button to view the XML', () =>
    loadOverview({ xmlFormId: 'f' }).afterResponses(app => {
      const btn = app.first('#form-view-xml-button');
      btn.getAttribute('href').should.equal('/v1/projects/1/forms/f.xml');
    }));

  describe('submissions', () => {
    it('shows the count', () =>
      loadOverview({ submissions: 123 }).afterResponses(app => {
        const items = app.find('.summary-item');
        items.length.should.equal(3);
        const item = items[1];
        item.first('.summary-item-heading').text().trim().should.equal('123');
        item.first('.summary-item-body').text().should.containEql('Submissions have');
      }));

    const targets = [
      ['icon', '.summary-item-icon-container'],
      ['count', '.summary-item-heading a'],
      ['caption', '.summary-item-body a']
    ];
    for (const [description, selector] of targets) {
      it(`renders a link for the ${description}`, () =>
        loadOverview({ xmlFormId: 'f' }).afterResponses(app => {
          const items = app.find('.summary-item');
          items.length.should.equal(3);
          const href = items[1].first(selector).getAttribute('href');
          href.should.equal('#/projects/1/forms/f/submissions');
        }));
    }
  });

  describe('app users', () => {
    it('shows the count', () =>
      loadOverview().afterResponses(app => {
        const items = app.find('.summary-item');
        items.length.should.equal(3);
        const item = items[2];
        item.first('.summary-item-heading').text().trim().should.equal('1');
        item.first('.summary-item-body').text().should.containEql('App User in this Project has');
      }));

    const targets = [
      ['icon', '.summary-item-icon-container'],
      ['count', '.summary-item-heading a'],
      ['caption', '.summary-item-body a']
    ];
    for (const [description, selector] of targets) {
      it(`renders a link for the ${description}`, () =>
        loadOverview({ xmlFormId: 'f' }).afterResponses(app => {
          const items = app.find('.summary-item');
          items.length.should.equal(3);
          const href = items[2].first(selector).getAttribute('href');
          href.should.equal('#/projects/1/form-access');
        }));
    }
  });
});
