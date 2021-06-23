import DocLink from '../../src/components/doc-link.vue';
import ProjectList from '../../src/components/project/list.vue';

import { load } from '../util/http';
import { mockLogin } from '../util/session';

describe('App', () => {
  it('hides the alert if the user clicks an a[target="_blank"]', async () => {
    mockLogin();
    const app = await load('/', { attachTo: document.body });
    app.vm.$alert().info('Something happened!');
    const preventDefault = (event) => {
      event.preventDefault();
    };
    document.addEventListener('click', preventDefault);
    await app.getComponent(ProjectList).getComponent(DocLink).trigger('click');
    try {
      app.should.not.alert();
    } finally {
      document.removeEventListener('click', preventDefault);
    }
  });
});
