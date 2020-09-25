import FormVersionSummaryItem from '../../../src/components/form-version/summary-item.vue';
import FormVersionViewXml from '../../../src/components/form-version/view-xml.vue';
import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormDraftStatus', () => {
  beforeEach(mockLogin);

  it('renders FormVersionSummaryItem for the draft', () => {
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { version: 'v2', draft: true });
    return load('/projects/1/forms/f/draft').then(app => {
      const component = app.first(FormVersionSummaryItem);
      component.getProp('version').version.should.equal('v2');
    });
  });

  it('toggles the "View XML" modal', () => {
    testData.extendedForms.createPast(1, { draft: true });
    return load('/projects/1/forms/f/draft').testModalToggles({
      modal: FormVersionViewXml,
      show: '.form-version-def-dropdown a',
      hide: '.btn-primary',
      respond: (series) => series.respondWithData(() => '<x/>')
    });
  });
});
