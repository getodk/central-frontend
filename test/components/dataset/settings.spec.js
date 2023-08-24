import DatasetPendingSubmissions from '../../../src/components/dataset/pending-submissions.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('DatasetSettings', () => {
  beforeEach(mockLogin);

  it('should have onReceipt selected', async () => {
    testData.extendedDatasets.createPast(1);
    const component = await load('/projects/1/entity-lists/trees/settings');
    component.get('input[value="true"]').element.checked.should.be.false();
    component.get('input[value="false"]').element.checked.should.be.true();
  });

  it('should have onApproval selected', async () => {
    testData.extendedDatasets.createPast(1, { approvalRequired: true });
    const component = await load('/projects/1/entity-lists/trees/settings');
    component.get('input[value="true"]').element.checked.should.be.true();
    component.get('input[value="false"]').element.checked.should.be.false();
  });

  it('should sends the correct request - true', async () => {
    testData.extendedDatasets.createPast(1);
    await load('/projects/1/entity-lists/trees/settings', { root: false })
      .complete()
      .request(async (component) => component.get('input[value="true"]').setValue(true))
      .beforeEachResponse((_, { method, url, data }) => {
        method.should.equal('PATCH');
        url.should.equal('/v1/projects/1/datasets/trees');
        data.should.eql({ approvalRequired: true });
      })
      .respondWithProblem();
  });

  it('should sends the correct request - false', async () => {
    testData.extendedDatasets.createPast(1, { approvalRequired: true });
    await load('/projects/1/entity-lists/trees/settings', { root: false })
      .complete()
      .request(async (component) => component.get('input[value="false"]').setValue(true))
      .beforeEachResponse((_, { method, url, data }) => {
        method.should.equal('PATCH');
        url.should.equal('/v1/projects/1/datasets/trees');
        data.should.eql({ approvalRequired: false });
      })
      .respondWithProblem();
  });

  it('should change approvalRequired to true', async () => {
    testData.extendedDatasets.createPast(1);
    await load('/projects/1/entity-lists/trees/settings', { root: false })
      .complete()
      .request(async (component) => component.get('input[value="true"]').setValue(true))
      .respondWithData(() => testData.extendedDatasets.last())
      .then((component) => {
        component.get('input[value="true"]').element.checked.should.be.true();
        component.get('input[value="false"]').element.checked.should.be.false();
        component.should.alert('success');
      });
  });

  it('should revert approvalRequired flag if modal is cancelled', async () => {
    testData.extendedDatasets.createPast(1, { approvalRequired: true });
    await load('/projects/1/entity-lists/trees/settings', { root: false })
      .complete()
      .request(async (component) => component.get('input[value="false"]').setValue(true))
      .respondWithProblem({
        code: 400.29,
        message: 'There are 10 pending submissions',
        details: { count: 10 }
      })
      .then(async (component) => {
        const modal = component.getComponent(DatasetPendingSubmissions);
        modal.props().state.should.be.true();
        await modal.get('.btn-link').trigger('click');
        modal.props().state.should.be.false();
        component.get('input[value="true"]').element.checked.should.be.true();
      });
  });

  it('should revert approvalRequired flag there is an error', async () => {
    testData.extendedDatasets.createPast(1, { approvalRequired: true });
    await load('/projects/1/entity-lists/trees/settings', { root: false })
      .complete()
      .request(async (component) => component.get('input[value="false"]').setValue(true))
      .respondWithProblem(500)
      .then(async (component) => {
        component.should.alert('danger');
        component.get('input[value="true"]').element.checked.should.be.true();
      });
  });

  it('should send correct convert query param', async () => {
    testData.extendedDatasets.createPast(1, { approvalRequired: true });
    await load('/projects/1/entity-lists/trees/settings', { root: false })
      .complete()
      .request(async (component) => component.get('input[value="false"]').setValue(true))
      .respondWithProblem({
        code: 400.29,
        message: 'There are 10 pending submissions',
        details: { count: 10 }
      })
      .complete()
      .request(async (component) => {
        const modal = component.getComponent(DatasetPendingSubmissions);
        modal.text().should.match(/10 records/);
        await modal.get('input[value="true"]').setValue(true);
        return modal.get('.btn-danger').trigger('click');
      })
      .beforeEachResponse((_, { method, url, data }) => {
        method.should.equal('PATCH');
        url.should.equal('/v1/projects/1/datasets/trees?convert=true');
        data.should.eql({ approvalRequired: false });
      })
      .respondWithData(() => testData.extendedDatasets.update(-1, { approvalRequired: false }))
      .then(async (component) => {
        const modal = component.getComponent(DatasetPendingSubmissions);
        modal.props().state.should.be.false();
        component.get('input[value="false"]').element.checked.should.be.true();
      });
  });
});
