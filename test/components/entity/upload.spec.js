import EntityUpload from '../../../src/components/entity/upload.vue';
import EntityUploadPopup from '../../../src/components/entity/upload/popup.vue';
import OdataLoadingMessage from '../../../src/components/odata-loading-message.vue';

import { queryString } from '../../../src/util/request';

import testData from '../../data';
import { mockHttp, load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { setFiles } from '../../util/trigger';

const showModal = () => {
  const dataset = testData.extendedDatasets.last();
  return mockHttp()
    .mount(EntityUpload, {
      container: {
        requestData: { dataset }
      }
    })
    .request(modal => modal.setProps({ state: true }))
    .modify(series => (dataset.entities !== 0
      ? series.respondWithData(() => testData.entityOData(5, 0, true))
      : series));
};
const csv = (text = 'label\ndogwood') => new File([text], 'my_data.csv');

describe('EntityUpload', () => {
  it('toggles the modal', () => {
    mockLogin();
    testData.extendedDatasets.createPast(1);
    return load('/projects/1/entity-lists/trees/entities', { root: false })
      .testModalToggles({
        modal: EntityUpload,
        show: '#dataset-entities-upload-button',
        hide: '.btn-link'
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

  describe('request for server data', () => {
    it('sends the correct request', () => {
      testData.extendedDatasets.createPast(1, { name: 'á', entities: 1 });
      testData.extendedEntities.createPast(1);
      const qs = queryString({ $orderby: '__system/createdAt asc', $top: 5 });
      return showModal().testRequests([
        { url: `/v1/projects/1/datasets/%C3%A1.svc/Entities${qs}` }
      ]);
    });

    it('does not send a request if there are no entities', () => {
      testData.extendedDatasets.createPast(1);
      return showModal().testNoRequest();
    });

    it('sends a new request if the modal is hidden, then shown again', () => {
      testData.extendedEntities.createPast(1);
      const qs = queryString({ $orderby: '__system/createdAt asc', $top: 5 });
      return showModal()
        .complete()
        .request(async (modal) => {
          await modal.setProps({ state: false });
          await modal.setProps({ state: true });
        })
        .respondWithData(() => testData.entityOData(5, 0, true))
        .testRequests([
          { url: `/v1/projects/1/datasets/trees.svc/Entities${qs}` }
        ]);
    });
  });

  describe('after a file is selected', () => {
    beforeEach(() => {
      testData.extendedDatasets.createPast(1);
    });

    it('shows the pop-up', async () => {
      const modal = await showModal();
      await setFiles(modal.get('input'), [csv()]);
      const popup = modal.getComponent(EntityUploadPopup);
      popup.props().filename.should.equal('my_data.csv');
      popup.props().count.should.equal(1);
    });

    it('hides the drop zone', async () => {
      const modal = await showModal();
      const dropZone = modal.get('#entity-upload-file-select');
      dropZone.should.be.visible();
      await setFiles(dropZone.get('input'), [csv()]);
      dropZone.should.be.hidden();
    });

    it('enables the append button', async () => {
      const modal = await showModal();
      const button = modal.get('.modal-actions .btn-primary');
      button.attributes('aria-disabled').should.equal('true');
      await setFiles(modal.get('input'), [csv()]);
      button.attributes('aria-disabled').should.equal('false');
    });

    it('resets after the clear button is clicked', async () => {
      const modal = await showModal();
      await setFiles(modal.get('input'), [csv()]);
      await modal.get('#entity-upload-popup .close').trigger('click');
      modal.findComponent(EntityUploadPopup).exists().should.be.false();
      modal.get('#entity-upload-file-select').should.be.visible();
      const button = modal.get('.modal-actions .btn-primary');
      button.attributes('aria-disabled').should.equal('true');
    });

    it('resets after the modal is hidden', async () => {
      const modal = await showModal();
      await setFiles(modal.get('input'), [csv()]);
      await modal.setProps({ state: false });
      await modal.setProps({ state: true });
      modal.findComponent(EntityUploadPopup).exists().should.be.false();
      modal.get('#entity-upload-file-select').should.be.visible();
      const button = modal.get('.modal-actions .btn-primary');
      button.attributes('aria-disabled').should.equal('true');
    });
  });

  it('sends the correct upload request', () => {
    testData.extendedDatasets.createPast(1, { name: 'á' });
    return showModal()
      .complete()
      .request(async (modal) => {
        await setFiles(modal.get('input'), [csv()]);
        return modal.get('.modal-actions .btn-primary').trigger('click');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: '/v1/projects/1/datasets/%C3%A1/entities',
        data: {
          source: { name: 'my_data.csv', size: 13 },
          entities: []
        }
      }]);
  });

  it('implements some standard button things', () => {
    testData.extendedDatasets.createPast(1);
    return showModal()
      .afterResponses(modal => setFiles(modal.get('input'), [csv()]))
      .testStandardButton({
        button: '.modal-actions .btn-primary',
        disabled: ['.btn-link'],
        modal: true,
        spinner: false
      });
  });

  it('shows a backdrop during the request', () => {
    testData.extendedDatasets.createPast(1);
    return showModal()
      .afterResponses(modal => {
        modal.find('.backdrop').exists().should.be.false();
      })
      .request(async (modal) => {
        await setFiles(modal.get('input'), [csv()]);
        return modal.get('.modal-actions .btn-primary').trigger('click');
      })
      .beforeAnyResponse(modal => {
        modal.find('.backdrop').exists().should.be.true();
      })
      .respondWithProblem()
      .afterResponse(modal => {
        modal.find('.backdrop').exists().should.be.false();
      });
  });

  describe('after a successful upload', () => {
    const upload = () => {
      testData.extendedDatasets.createPast(1);
      return load('/projects/1/entity-lists/trees/entities', { root: false })
        .complete()
        .request(async (component) => {
          await component.get('#dataset-entities-upload-button').trigger('click');
          const modal = component.getComponent(EntityUpload);
          await setFiles(modal.get('input'), [csv()]);
          return modal.get('.modal-actions .btn-primary').trigger('click');
        })
        .respondWithSuccess()
        .respondWithData(() => {
          testData.extendedEntities.createPast(1);
          return testData.entityOData();
        });
    };

    it('hides the modal', async () => {
      const component = await upload();
      component.getComponent(EntityUpload).props().state.should.be.false();
    });

    it('shows a success alert', async () => {
      const component = await upload();
      component.should.alert('success', 'Success! Your Entities have been uploaded.');
    });

    it('sends a new request for OData', () =>
      upload().testRequests([
        null,
        {
          url: '/v1/projects/1/datasets/trees.svc/Entities?%24top=250&%24count=true'
        }
      ]));

    it('renders correctly during the request', () =>
      upload().beforeEachResponse((component, _, i) => {
        if (i === 0) return;
        component.get('#entity-table').should.be.hidden();
        const props = component.getComponent(OdataLoadingMessage).props();
        props.odata.awaitingResponse.should.be.true();
        props.refreshing.should.be.false();
        props.totalCount.should.equal(1);
      }));
  });
});
