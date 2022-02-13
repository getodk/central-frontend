import DateTime from '../../../src/components/date-time.vue';
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

  it('shows the version string', async () => {
    testData.extendedForms.createPast(1);
    const component = await load('/projects/1/forms/f/versions', { root: false });
    const row = component.getComponent(FormVersionRow);
    row.getComponent(FormVersionString).props().version.should.equal('v1');
  });

  describe('published', () => {
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
