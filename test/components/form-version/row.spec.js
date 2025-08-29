import DateTime from '../../../src/components/date-time.vue';
import EnketoPreview from '../../../src/components/enketo/preview.vue';
import FormVersionDefDropdown from '../../../src/components/form-version/def-dropdown.vue';
import FormVersionRow from '../../../src/components/form-version/row.vue';
import FormVersionString from '../../../src/components/form-version/string.vue';
import FormVersionViewXml from '../../../src/components/form-version/view-xml.vue';
import TimeAndUser from '../../../src/components/time-and-user.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormVersionRow', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'Alice' });
  });

  describe('name column', () => {
    it('shows the version string', async () => {
      testData.extendedForms.createPast(1);
      const component = await load('/projects/1/forms/f/versions', { root: false });
      const row = component.getComponent(FormVersionRow);
      row.getComponent(FormVersionString).props().version.should.equal('v1');
    });

    it('shows a tag for the current version', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1);
      const component = await load('/projects/1/forms/f/versions', { root: false });
      const rows = component.findAllComponents(FormVersionRow);
      rows.length.should.equal(2);
      const chip = rows[0].get('.chip');
      chip.text().should.equal('Current Published Version');
      rows[1].find('.chip').exists().should.be.false;
    });

    it('shows tooltips', async () => {
      // The text truncation works slightly differently for the current version
      // vs. other versions. With the current version, the flexbox has two
      // children, whereas for other versions, it only has one. Here, we test
      // the current version and another version.
      testData.extendedForms.createPast(1, { version: 'x'.repeat(1000) });
      testData.extendedFormVersions.createPast(1, { version: 'y'.repeat(1000) });
      const component = await load('/projects/1/forms/f/versions', { root: false });
      const versionStrings = component.findAllComponents(FormVersionString);
      versionStrings.length.should.equal(2);
      await versionStrings[0].should.have.textTooltip();
      await versionStrings[1].should.have.textTooltip();
    });
  });

  describe('published column', () => {
    it('shows publishedAt', () => {
      const form = testData.extendedForms.createPast(1).last();
      return load('/projects/1/forms/f/versions').then(app => {
        const dateTime = app.getComponent(FormVersionRow).getComponent(DateTime);
        dateTime.props().iso.should.equal(form.publishedAt);
      });
    });

    it('shows publishedBy', () => {
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f/versions').then(app => {
        const component = app.getComponent(FormVersionRow).getComponent(TimeAndUser);
        const { user } = component.props();
        user.id.should.equal(testData.extendedUsers.first().id);
        user.displayName.should.equal('Alice');
      });
    });
  });

  describe('actions column', () => {
    it('shows def dropdown and preview for current version of form and def only for past versions', async () => {
      testData.extendedForms.createPast(1, { version: '1' });
      testData.extendedFormVersions.createPast(1, { version: '2' });
      const component = await load('/projects/1/forms/f/versions', { root: false });
      const rows = component.findAllComponents(FormVersionRow);

      rows[0].props().current.should.equal(true);
      rows[0].findComponent(FormVersionDefDropdown).exists().should.be.true;
      rows[0].findComponent(EnketoPreview).exists().should.be.true;

      rows[1].props().current.should.equal(false);
      rows[1].findComponent(FormVersionDefDropdown).exists().should.be.true;
      rows[1].findComponent(EnketoPreview).exists().should.be.false;
    });
  });

  it('toggles the "View XML" modal', () => {
    testData.extendedForms.createPast(1);
    return load('/projects/1/forms/f/versions', { root: false }).testModalToggles({
      modal: FormVersionViewXml,
      show: '.form-version-row .form-version-def-dropdown a',
      hide: '.btn-primary',
      respond: (series) => series.respondWithData(() => '<x/>')
    });
  });
});
