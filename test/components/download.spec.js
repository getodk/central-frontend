import sinon from 'sinon';

import Download from '../../src/components/download.vue';

import { load } from '../util/http';
import { mockLogin } from '../util/session';
import { mockRouter } from '../util/router';
import { mount } from '../util/lifecycle';

describe('Download', () => {
  beforeEach(mockLogin);

  it('sets the correct href attribute', async () => {
    const component = mount(Download, {
      container: { router: mockRouter('/dl/a/b.txt?c=d#e') }
    });
    component.get('a').attributes().href.should.equal('/v1/a/b.txt?c=d#e');
  });

  it('shows the filename', () => {
    const component = mount(Download, {
      container: { router: mockRouter('/dl/a/b.txt?c=d#e') }
    });
    component.get('p').text().should.startWith('b.txt will begin');
  });

  it('clicks the download link', () => {
    const handler = sinon.fake();
    document.addEventListener('click', handler);
    const component = mount(Download, {
      container: { router: mockRouter('/dl/a.txt') },
      attachTo: document.body
    });
    try {
      handler.called.should.be.true();
      const { target } = handler.getCall(0).args[0];
      target.should.equal(component.get('a').element);
    } finally {
      document.removeEventListener('click', handler);
    }
  });

  it('clicks the download link after a route update', () => {
    const handler = sinon.fake();
    return load('/dl/a.txt')
      .afterResponses(app => {
        const a = app.getComponent(Download).get('a');
        a.element.addEventListener('click', handler);
      })
      .route('/dl/b.txt')
      .afterResponses(() => {
        handler.callCount.should.equal(1);
      })
      .route('/dl/b.txt?c=d')
      .afterResponses(() => {
        handler.callCount.should.equal(2);
      });
  });
});
