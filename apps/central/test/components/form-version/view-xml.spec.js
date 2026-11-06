import XmlViewer from '../../../src/components/xml-viewer.vue';

import { mount } from '../../util/lifecycle';

describe('FormVersionViewXml', () => {
  it('formats the XML', () => {
    const modal = mount(XmlViewer, {
      props: { state: true, xml: '<x><y/></x>' }
    });
    modal.get('code').text().should.equal('<x>\r\n    <y/>\r\n</x>');
  });

  it('shows a spinner when loading', () => {
    const modal = mount(XmlViewer, {
      props: { state: true, loading: true }
    });
    modal.get('.spinner').should.be.visible();
  });
});
