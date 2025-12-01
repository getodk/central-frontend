import sinon from 'sinon';

import useRequest from '../../src/composables/request';
import { noop } from '../../src/util/util';

import { mockHttp } from '../util/http';
import { mount } from '../util/lifecycle';

const TestUtilRequest = {
  template: '<div></div>',
  setup() {
    const { request, awaitingResponse } = useRequest();
    return { request, awaitingResponse };
  }
};

describe('useRequest()', () => {
  it('sends the correct request', () =>
    mockHttp()
      .mount(TestUtilRequest)
      .request(component =>
        component.vm.request({ method: 'DELETE', url: '/v1/projects/1' }))
      .respondWithSuccess()
      .testRequests([{ method: 'DELETE', url: '/v1/projects/1' }]));

  it('provides convenience methods for HTTP verbs', () =>
    mockHttp()
      .mount(TestUtilRequest)
      .request(component => component.vm.request.delete('/v1/projects/1'))
      .respondWithSuccess()
      .testRequests([{ method: 'DELETE', url: '/v1/projects/1' }]));

  describe('awaitingResponse', () => {
    it('sets awaitingResponse to true during the request', () =>
      mockHttp()
        .mount(TestUtilRequest)
        .request(component =>
          component.vm.request({ method: 'DELETE', url: '/v1/projects/1' }))
        .beforeEachResponse(component => {
          component.vm.awaitingResponse.should.be.true;
        })
        .respondWithSuccess());

    it('sets awaitingResponse to false after a successful response', () =>
      mockHttp()
        .mount(TestUtilRequest)
        .request(component =>
          component.vm.request({ method: 'DELETE', url: '/v1/projects/1' }))
        .respondWithSuccess()
        .afterResponse(component => {
          component.vm.awaitingResponse.should.be.false;
        }));

    it('sets awaitingResponse to false after an error response', () =>
      mockHttp()
        .mount(TestUtilRequest)
        .request(component =>
          component.vm.request({ method: 'DELETE', url: '/v1/projects/1' })
            .catch(noop))
        .respondWithProblem()
        .afterResponse(component => {
          component.vm.awaitingResponse.should.be.false;
        }));
  });

  describe('alert', () => {
    it('shows the Problem message by default', () =>
      mockHttp()
        .mount(TestUtilRequest)
        .request(component =>
          component.vm.request({ method: 'DELETE', url: '/v1/projects/1' })
            .catch(noop))
        .respondWithProblem({ code: 403.1, message: 'Insufficient rights' })
        .afterResponse(component => {
          component.should.alert('danger', 'Insufficient rights');
        }));

    it('shows the message from the problemToAlert function', () =>
      mockHttp()
        .mount(TestUtilRequest)
        .request(component => component.vm.request({
          method: 'DELETE',
          url: '/v1/projects/1',
          problemToAlert: () => 'Message from problemToAlert'
        }).catch(noop))
        .respondWithProblem()
        .afterResponse(component => {
          component.should.alert('danger', 'Message from problemToAlert');
        }));

    it('does not show alert when it is set to false', () =>
      mockHttp()
        .mount(TestUtilRequest)
        .request(component =>
          component.vm.request({ method: 'DELETE', url: '/v1/projects/1', alert: false })
            .catch(noop))
        .respondWithProblem({ code: 403.1, message: 'Insufficient rights' })
        .afterResponse(component => {
          component.should.not.alert();
        }));
  });

  describe('fulfillProblem', () => {
    it('rejects if fulfillProblem returns false', () =>
      mockHttp()
        .mount(TestUtilRequest)
        .request(component => {
          const promise = component.vm.request({
            method: 'DELETE',
            url: '/v1/projects/1',
            fulfillProblem: () => false
          });
          return promise.should.be.rejected;
        })
        .respondWithProblem());

    it('fulfills to the response if fulfillProblem returns true', () =>
      mockHttp()
        .mount(TestUtilRequest)
        .request(async (component) => {
          const { data } = await component.vm.request({
            method: 'DELETE',
            url: '/v1/projects/1',
            fulfillProblem: () => true
          });
          data.code.should.equal(500.1);
        })
        .respondWithProblem());

    it('passes the Problem to fulfillProblem', () =>
      mockHttp()
        .mount(TestUtilRequest)
        .request(async (component) => {
          const fulfillProblem = sinon.stub().returns(true);
          await component.vm.request({
            method: 'DELETE',
            url: '/v1/projects/1',
            fulfillProblem
          });
          fulfillProblem.getCall(0).args[0].code.should.equal(500.1);
        })
        .respondWithProblem());
  });

  describe('file size exceeds limit', () => {
    const largeFile = (name) => {
      const file = new File([''], name);
      // At least in Headless Chrome, `file` does not have its own `size`
      // property, but rather uses the Blob.prototype.size getter.
      Object.hasOwn(file, 'size').should.be.false;
      Object.defineProperty(file, 'size', { value: 100000001 });
      return file;
    };

    it('does not send a request', () =>
      mockHttp()
        .mount(TestUtilRequest)
        .testNoRequest(component =>
          component.vm.request({
            method: 'POST',
            url: '/v1/projects/1/forms',
            data: largeFile('form.xml')
          }).catch(noop)));

    it('returns a rejected promise', () => {
      const component = mount(TestUtilRequest);
      const result = component.vm.request({
        method: 'POST',
        url: '/v1/projects/1/forms',
        data: largeFile('form.xml')
      });
      return result.should.be.rejected;
    });

    it('shows a danger alert', () => {
      const component = mount(TestUtilRequest);
      component.vm.request({
        method: 'POST',
        url: '/v1/projects/1/forms',
        data: largeFile('form.xml')
      }).catch(noop);
      component.should.alert('danger', (message) => {
        message.should.include('form.xml');
      });
    });
  });
});
