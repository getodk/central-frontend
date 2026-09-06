import SubmissionDefDropdown from '../../../src/components/submission/def-dropdown.vue';

import { mount } from '../../util/lifecycle';

const mountComponent = (props = {}) => mount(SubmissionDefDropdown, {
  props: {
    projectId: '1',
    xmlFormId: 'a b',
    instanceId: 's',
    ...props
  }
});

describe('SubmissionDefDropdown', () => {
  it('emits a view-xml event', async () => {
    const dropdown = mountComponent();
    await dropdown.get('a').trigger('click');
    dropdown.emitted('view-xml').length.should.equal(1);
  });

  it('has the correct attributes for download button', () => {
    const dropdown = mountComponent();
    const { href, download } = dropdown.findAll('a')[1].attributes();
    href.should.equal('/v1/projects/1/forms/a%20b/submissions/s.xml');
    download.should.equal('s.xml');
  });
});
