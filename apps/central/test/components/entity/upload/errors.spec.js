import EntityUploadErrors from '../../../../src/components/entity/upload/errors.vue';

import { mount } from '../../../util/lifecycle';

const mountComponent = (options) => mount(EntityUploadErrors, options);

describe('EntityUploadErrors', () => {
  it('shows a data error', () => {
    const component = mountComponent({
      props: { dataError: 'Such and such details' }
    });
    const p = component.findAll('.entity-upload-alert p');
    p.length.should.equal(2);
    p[0].text().should.equal('Data error');
    p[1].text().should.equal('Such and such details');
  });
});
