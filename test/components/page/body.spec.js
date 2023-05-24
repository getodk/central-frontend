import PageBody from '../../../src/components/page/body.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('PageBody', () => {
  beforeEach(mockLogin);

  describe('fullWidth route meta field', () => {
    it('does not add full-width class if meta field is false', async () => {
      const app = await load('/');
      app.vm.$route.meta.fullWidth.should.be.false();
      app.getComponent(PageBody).classes('full-width').should.be.false();
    });

    it('adds the full-width class if the meta field is true', async () => {
      testData.extendedForms.createPast(1);
      const app = await load('/projects/1/forms/f/submissions');
      app.vm.$route.meta.fullWidth.should.be.true();
      app.getComponent(PageBody).classes('full-width').should.be.true();
    });
  });
});
