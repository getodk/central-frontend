import TestUtilRequest from '../util/components/request.vue';

import { mockHttp } from '../util/http';
import { mount } from '../util/lifecycle';

describe('mixins/request', () => {
  describe('file size exceeds limit', () => {
    const largeFile = (name) => {
      const file = new File([''], name);
      // At least in Headless Chrome, `file` does not have its own `size`
      // property, but rather uses the Blob.prototype.size getter.
      Object.prototype.hasOwnProperty.call(file, 'size').should.be.false();
      Object.defineProperty(file, 'size', { value: 100000001 });
      return file;
    };

    it('does not send a request', () =>
      mockHttp()
        .mount(TestUtilRequest)
        .testNoRequest(component => {
          component.vm.post('/v1/projects/1/forms', largeFile('form.xml'));
        }));

    it('shows a danger alert', () => {
      const component = mount(TestUtilRequest);
      component.vm.post('/v1/projects/1/forms', largeFile('form.xml'));
      component.should.alert('danger', (message) => {
        message.should.containEql('form.xml');
      });
    });

    it('returns a rejected promise', () => {
      const component = mount(TestUtilRequest);
      const result = component.vm.post(
        '/v1/projects/1/forms',
        largeFile('form.xml')
      );
      return result.should.be.rejected();
    });
  });
});
