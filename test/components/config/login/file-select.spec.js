import ConfigLoginFileSelect from '../../../../src/components/config/login/file-select.vue';

import testData from '../../../data';
import { dragAndDrop, setFiles } from '../../../util/trigger';
import { mockHttp } from '../../../util/http';
import { mount } from '../../../util/lifecycle';

const mountOptions = () => ({
  props: { name: 'logo' },
  container: {
    requestData: { serverConfig: testData.standardConfigs.byKey() }
  }
});
const mountComponent = () => mount(ConfigLoginFileSelect, mountOptions());

const createImage = () => new File([''], 'some_image.jpg', { type: 'image/jpeg' });

describe('ConfigLoginFileSelect', () => {
  describe('blob does not exist', () => {
    it('shows a drop zone', () => {
      const component = mountComponent();
      component.find('.file-drop-zone').exists().should.be.true;
    });

    it('sends the correct request on drop', () => {
      const image = createImage();
      return mockHttp()
        .mount(ConfigLoginFileSelect, mountOptions())
        .request(component =>
          dragAndDrop(component.get('.file-drop-zone'), [image]))
        .respondWithProblem()
        .testRequests([{
          method: 'POST',
          url: '/v1/config/logo',
          data: image,
          headers: { 'Content-Type': 'image/jpeg' }
        }]);
    });

    describe('after an image is selected using the file input', () => {
      it('sends a request', () =>
        mockHttp()
          .mount(ConfigLoginFileSelect, mountOptions())
          .request(component =>
            setFiles(component.get('input'), [createImage()]))
          .beforeEachResponse((_, { url }) => {
            url.should.equal('/v1/config/logo');
          })
          .respondWithProblem());

      it('resets the input after an error response', () =>
        mockHttp()
          .mount(ConfigLoginFileSelect, mountOptions())
          .request(component =>
            setFiles(component.get('input'), [createImage()]))
          .respondWithProblem()
          .afterResponses(component => {
            component.get('input').element.value.should.equal('');
          }));
    });

    describe('after a successful response', () => {
      const upload = () => mockHttp()
        .mount(ConfigLoginFileSelect, mountOptions())
        .request(component =>
          dragAndDrop(component.get('.file-drop-zone'), [createImage()]))
        .respondWithData(() =>
          testData.standardConfigs.createNew({ key: 'logo', blobExists: true }));

      it('shows a toast', async () => {
        const component = await upload();
        component.should.toast('Image successfully saved.');
      });

      it('shows a button to remove the image', async () => {
        const component = await upload();
        component.find('.file-drop-zone').exists().should.be.false;
        component.get('.btn-primary').text().should.equal('Remove image');
      });
    });
  });

  describe('blob exists', () => {
    beforeEach(() => {
      testData.standardConfigs.createPast(1, { key: 'logo', blobExists: true });
    });

    it('shows a button to remove the image', async () => {
      const component = mountComponent();
      component.find('.file-drop-zone').exists().should.be.false;
      component.get('.btn-primary').text().should.equal('Remove image');
    });

    it('sends the correct request', () =>
      mockHttp()
        .mount(ConfigLoginFileSelect, mountOptions())
        .request(component => component.get('.btn-primary').trigger('click'))
        .respondWithProblem()
        .testRequests([{
          method: 'DELETE',
          url: '/v1/config/logo'
        }]));

    describe('after a successful response', () => {
      const remove = () => mockHttp()
        .mount(ConfigLoginFileSelect, mountOptions())
        .request(component => component.get('.btn-primary').trigger('click'))
        .respondWithSuccess();

      it('shows a toast', async () => {
        const component = await remove();
        component.should.toast('Image successfully removed.');
      });

      it('shows a drop zone', async () => {
        const component = await remove();
        component.find('.file-drop-zone').exists().should.be.true;
        component.find('.btn-primary').exists().should.be.false;
      });
    });
  });
});
