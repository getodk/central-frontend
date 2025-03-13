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
  it('renders correctly if the form is published', async () => {
    setLuxon({ defaultZoneName: 'UTC' });
    testData.extendedForms.createPast(1, {
      version: 'foobar',
      publishedAt: '2025-01-02T12:34:56.789Z'
    });
    const component = mountComponent();
    component.classes('draft').should.be.false;
    const subtitle = component.get('.form-edit-section-subtitle').text();
    subtitle.should.equal('Published 2025/01/02 12:34');
    const versionString = component.getComponent(FormVersionString);
    versionString.text().should.equal('foobar');
    await versionString.should.have.textTooltip();
  });

  it('renders correctly if the form is a draft', () => {
    testData.extendedForms.createPast(1, { draft: true });
    const component = mountComponent();
    component.classes('draft').should.be.true;
    const subtitle = component.get('.form-edit-section-subtitle').text();
    subtitle.should.equal('Not yet published');
    component.findComponent(FormVersionString).exists().should.be.false;
  });
});
