import { nextTick } from 'vue';

import EntityUploadHeaderReview from '../../../../src/components/entity/upload/header-review.vue';

import { mount } from '../../../util/lifecycle';

describe('EntityUploadHeaderReview', () => {
  it('shows missing properties', async () => {
    const component = mount(EntityUploadHeaderReview, {
      props: { missingProperties: ['foo', 'bar'] }
    });
    // Wait for I18nList to render.
    await nextTick();

    const p = component.findAll('p');
    p.length.should.equal(3);
    p[2].text().should.equal('foo, bar');
  });
});
