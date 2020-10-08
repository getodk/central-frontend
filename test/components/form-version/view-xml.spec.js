import FormVersionViewXml from '../../../src/components/form-version/view-xml.vue';
import { mount } from '../../util/lifecycle';

describe('FormVersionViewXml', () => {
  it('formats the XML', () => {
    const modal = mount(FormVersionViewXml, {
      propsData: { state: true },
      requestData: { formVersionXml: '<x><y/></x>' }
    });
    modal.first('code').text().should.equal('<x>\r\n    <y/>\r\n</x>');
  });
});
