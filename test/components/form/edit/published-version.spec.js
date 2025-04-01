import FormEditPublishedVersion from '../../../../src/components/form/edit/published-version.vue';
import FormVersionString from '../../../../src/components/form-version/string.vue';

import testData from '../../../data';
import { mount } from '../../../util/lifecycle';
import { setLuxon } from '../../../util/date-time';

const mountComponent = () => mount(FormEditPublishedVersion, {
  container: {
    requestData: { form: testData.extendedForms.last() }
  }
});

describe('FormEditPublishedVersion', () => {
  it('shows the correct information', async () => {
    setLuxon({ defaultZoneName: 'UTC' });
    testData.extendedForms.createPast(1, {
      version: 'foobar',
      publishedAt: '2025-01-02T12:34:56.789Z'
    });
    const component = mountComponent();
    const subtitle = component.get('.form-edit-section-subtitle').text();
    subtitle.should.equal('Published 2025/01/02 12:34');
    const versionString = component.getComponent(FormVersionString);
    versionString.text().should.equal('foobar');
    await versionString.should.have.textTooltip();
  });
});
