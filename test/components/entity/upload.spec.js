import EntityUpload from '../../../src/components/entity/upload.vue';

import testData from '../../data';
import { mockHttp, load } from '../../util/http';
import { mockLogin } from '../../util/session';

const mountOptions = () => {
  const dataset = testData.extendedDatasets.last();
  return {
    props: { state: true },
    container: {
      requestData: { dataset }
    }
  };
};

describe('EntityUpload', () => {
  it('toggles the modal', () => {
    mockLogin();
    testData.extendedDatasets.createPast(1);
    return load('/projects/1/entity-lists/trees/entities', { root: false })
      .testModalToggles({
        modal: EntityUpload,
        show: '#dataset-entities-upload-button',
        hide: '.modal-actions .btn-link'
      });
  });

  it('does not render the upload button for a project viewer', async () => {
    mockLogin({ role: 'none' });
    testData.extendedProjects.createPast(1, { role: 'viewer', datasets: 1 });
    testData.extendedDatasets.createPast(1);
    const component = await load('/projects/1/entity-lists/trees/entities', {
      root: false
    });
    const button = component.find('#dataset-entities-upload-button');
    button.exists().should.be.false();
  });

  it('sends the correct upload request', () => {
    testData.extendedDatasets.createPast(1, { name: 'á' });
    return mockHttp()
      .mount(EntityUpload, mountOptions())
      .complete()
      .request(modal => modal.get('.btn-primary').trigger('click'))
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: '/v1/projects/1/datasets/%C3%A1/entities',
        data: {
          source: { name: 'TODO' },
          entities: []
        }
      }]);
  });

  it('implements some standard button things', () => {
    testData.extendedDatasets.createPast(1);
    return mockHttp()
      .mount(EntityUpload, mountOptions())
      .testStandardButton({
        button: '.btn-primary',
        disabled: ['.btn-link'],
        modal: true
      });
  });

  describe('after a successful upload', () => {
    it('hides the modal', () => {
      testData.extendedDatasets.createPast(1);
      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .complete()
        .request(component =>
          component.get('#entity-upload .btn-primary').trigger('click'))
        .respondWithSuccess()
        .afterResponse(component => {
          component.getComponent(EntityUpload).props().state.should.be.false();
        });
    });
  });
});
