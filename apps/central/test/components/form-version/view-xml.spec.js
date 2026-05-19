import FormVersionViewXml from '../../../src/components/form-version/view-xml.vue';

import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

describe('FormVersionViewXml', () => {
  it('formats the XML', () => {
    const modal = mount(FormVersionViewXml, {
      props: { state: true },
      container: {
        requestData: testRequestData(['formVersionXml'], {
          formVersionXml: '<x><y/></x>'
        })
      }
    });
    modal.get('code').text().should.equal('<x>\r\n    <y/>\r\n</x>');
  });
});
