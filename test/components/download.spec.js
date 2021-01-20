import sinon from 'sinon';

import Download from '../../src/components/download.vue';

import { load } from '../util/http';
import { mockLogin } from '../util/session';

describe('Download', () => {
  beforeEach(mockLogin);

  it('sets the correct href attribute', async () => {
    const app = await load('/dl/a/b.txt?c=d#e');
    const href = app.first(Download).first('a').getAttribute('href');
    href.should.equal('/v1/a/b.txt?c=d#e');
  });

  it('shows the filename', async () => {
    const app = await load('/dl/a/b.txt?c=d#e');
    app.first(Download).first('p').text().should.startWith('b.txt will begin');
  });

  it('clicks the download link', () => {
    const handler = sinon.fake();
    document.addEventListener('click', handler);
    return load('/dl/a.txt', { attachToDocument: true }, {})
      .then(app => {
        handler.called.should.be.true();
        const a = app.first(Download).first('a');
        handler.getCall(0).args[0].target.should.equal(a.element);
      })
      .finally(() => {
        document.removeEventListener('click', handler);
      });
  });

  it('clicks the download link after a route update', () => {
    const handler = sinon.fake();
    return load('/dl/a.txt')
      .afterResponses(app => {
        const a = app.first(Download).first('a');
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
