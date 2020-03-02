import Form from '../../../src/presenters/form';
import FormVersionStandardButtons from '../../../src/components/form-version/standard-buttons.vue';
import testData from '../../data';
import { mount } from '../../util/lifecycle';

const mountComponent = (version) => mount(FormVersionStandardButtons, {
  propsData: { version: new Form(version) }
});

describe('FormVersionStandardButtons', () => {
  describe('button to view the XML', () => {
    it('has the correct href attribute for a published version', () => {
      const component = mountComponent(testData.extendedForms
        .createPast(1, { xmlFormId: 'f', version: 'v1' })
        .last());
      const href = component.first('a').getAttribute('href');
      href.should.equal('/v1/projects/1/forms/f/versions/v1.xml');
    });

    it('has the correct href attribute for a form draft', () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'f', draft: true });
      const component = mountComponent(testData.extendedFormDrafts.last());
      const href = component.first('a').getAttribute('href');
      href.should.equal('/v1/projects/1/forms/f/draft.xml');
    });
  });
});
