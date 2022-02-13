import FormVersionString from '../../../src/components/form-version/string.vue';
import FormVersionViewXml from '../../../src/components/form-version/view-xml.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormDraftStatus', () => {
  beforeEach(mockLogin);

  it('shows the version string of the draft', async () => {
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { version: 'v2', draft: true });
    const component = await load('/projects/1/forms/f/draft', { root: false });
    component.getComponent(FormVersionString).props().version.should.equal('v2');
  });

  it('toggles the "View XML" modal', () => {
    testData.extendedForms.createPast(1, { draft: true });
    return load('/projects/1/forms/f/draft', { root: false }).testModalToggles({
      modal: FormVersionViewXml,
      show: '.form-version-def-dropdown a',
      hide: '.btn-primary',
      respond: (series) => series.respondWithData(() => '<x/>')
    });
  });
});
