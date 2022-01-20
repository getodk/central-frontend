import TestUtilRequest from '../util/components/request.vue';

import { noop } from '../../src/util/util';

import { mockHttp } from '../util/http';

describe('requests reusable', () => {
  describe('awaitingResponse', () => {
    it('sets awaitingResponse to true during the request', () =>
      mockHttp()
        .mount(TestUtilRequest)
        .request(component =>
          component.vm.request({ method: 'DELETE', url: '/v1/projects/1' }))
        .beforeEachResponse(component => {
          component.vm.awaitingResponse.should.be.true();
        })
        .respondWithSuccess());

    it('sets awaitingResponse to false after a successful response', () =>
      mockHttp()
        .mount(TestUtilRequest)
        .request(component =>
          component.vm.request({ method: 'DELETE', url: '/v1/projects/1' }))
        .respondWithSuccess()
        .afterResponse(component => {
          component.vm.awaitingResponse.should.be.false();
        }));

    it('sets awaitingResponse to false after an unsuccessful response', () =>
      mockHttp()
        .mount(TestUtilRequest)
        .request(component =>
          component.vm.request({ method: 'DELETE', url: '/v1/projects/1' })
            .catch(noop))
        .respondWithProblem()
        .afterResponse(component => {
          component.vm.awaitingResponse.should.be.false();
        }));
  });

  it('shows an i18n message in an alert', () =>
    mockHttp()
      .mount(TestUtilRequest)
      .request(component =>
        component.vm.request({ method: 'DELETE', url: '/v1/projects/1' })
          .catch(noop))
      .respondWithProblem(404.1)
      .afterResponse(component => {
        component.should.alert('danger', 'Message for locale');
      }));
});
