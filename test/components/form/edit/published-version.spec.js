import FormEditPublishedVersion from '../../../../src/components/form/edit/published-version.vue';
import FormVersionString from '../../../../src/components/form-version/string.vue';

import testData from '../../../data';
import { mount } from '../../../util/lifecycle';

const mountComponent = () => mount(FormEditPublishedVersion, {
  container: {
    requestData: { form: testData.extendedForms.last() }
  }
});

describe('FormEditPublishedVersion', () => {
  it('renders correctly if the form is published', async () => {
    testData.extendedForms.createPast(1, { version: 'foobar' });
    const component = mountComponent();
    component.classes('draft').should.be.false;
    const subtitle = component.get('.form-edit-section-subtitle').text();
    subtitle.should.startWith('Published 20');
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
