import FormEditDef from '../../../../src/components/form/edit/def.vue';
import FormVersionString from '../../../../src/components/form-version/string.vue';
import FormVersionViewXml from '../../../../src/components/form-version/view-xml.vue';

import testData from '../../../data';
import { load } from '../../../util/http';
import { mockLogin } from '../../../util/session';

describe('FormEditDef', () => {
  beforeEach(mockLogin);

  it('shows the version string of the draft', async () => {
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { version: 'v2', draft: true });
    const component = await load('/projects/1/forms/f/draft', { root: false });
    const { version } = component.getComponent(FormEditDef)
      .getComponent(FormVersionString)
      .props();
    version.should.equal('v2');
  });

  describe('subtitle', () => {
    it('shows subtitle if form draft differs from published definition', async () => {
      testData.extendedForms.createPast(1, { hash: 'foo' });
      testData.extendedFormVersions.createPast(1, { hash: 'bar', draft: true });
      const app = await load('/projects/1/forms/f/draft');
      const subtitle = app.get('#form-edit-def .form-edit-section-subtitle').text();
      subtitle.should.equal('Changed from published version');
    });

    it('does not show the subtitle if the form is not published', async () => {
      testData.extendedForms.createPast(1, { draft: true });
      const app = await load('/projects/1/forms/f/draft');
      const subtitle = app.get('#form-edit-def .form-edit-section-subtitle').text();
      subtitle.should.equal('Uploaded');
    });

    it('does not show the subtitle if the form draft does not differ', async () => {
      testData.extendedForms.createPast(1, { hash: 'foo' });
      testData.extendedFormVersions.createPast(1, { hash: 'foo', draft: true });
      const app = await load('/projects/1/forms/f/draft');
      const subtitle = app.get('#form-edit-def .form-edit-section-subtitle').text();
      subtitle.should.equal('Uploaded');
    });
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
