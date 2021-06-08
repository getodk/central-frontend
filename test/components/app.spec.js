import DocLink from '../../src/components/doc-link.vue';
import ProjectList from '../../src/components/project/list.vue';

import { load } from '../util/http';
import { mockLogin } from '../util/session';
import { trigger } from '../util/event';

describe('App', () => {
  it('hides the alert if the user clicks an a[target="_blank"]', () => {
    mockLogin();
    const preventDefault = (event) => {
      event.preventDefault();
    };
    return load('/', { attachToDocument: true })
      .then(app => {
        app.vm.$alert().info('Something happened!');
        document.addEventListener('click', preventDefault);
        return trigger.click(app.first(ProjectList).first(DocLink))
          .then(() => {
            app.should.not.alert();
          });
      })
      .finally(() => {
        document.removeEventListener('click', preventDefault);
      });
  });
});
