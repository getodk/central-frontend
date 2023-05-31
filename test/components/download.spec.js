import sinon from 'sinon';

import NotFound from '../../src/components/not-found.vue';

import { load } from '../util/http';
import { mockLogin } from '../util/session';

describe('Download', () => {
  beforeEach(mockLogin);

  it('requires the projectId route param to be integer', async () => {
    const component = await load('/dl/projects/p/forms/f/submissions/s/attachments/a', {
      root: false
    });
    component.findComponent(NotFound).exists().should.be.true();
  });

  it('sets the correct href attribute', async () => {
    const component = await load('/dl/projects/1/forms/a%20b/submissions/c%20d/attachments/e%20f', {
      root: false
    });
    const { href } = component.get('a').attributes();
    href.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/attachments/e%20f');
  });

  it('shows the attachment name', async () => {
    const component = await load('/dl/projects/1/forms/a%20b/submissions/c%20d/attachments/e%20f', {
      root: false
    });
    component.get('strong').text().should.equal('e f');
  });

  it('clicks the download link', () => {
    const handler = sinon.fake();
    document.addEventListener('click', handler);
    return load('/dl/projects/1/forms/f/submissions/s/attachments/a', {
      root: false,
      attachTo: document.body
    })
      .then(component => {
        handler.called.should.be.true();
        const { target } = handler.getCall(0).args[0];
        target.should.equal(component.get('a').element);
      })
      .finally(() => { document.removeEventListener('click', handler); });
  });
});
