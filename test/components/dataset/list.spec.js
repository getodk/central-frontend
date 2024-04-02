import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('DatasetList', () => {
  it('sends the correct initial requests', () => {
    mockLogin();
    testData.extendedDatasets.createPast(1);
    return load('/projects/1/entity-lists', {
      root: false
    }).testRequests([
      { url: '/v1/projects/1/datasets', extended: true }
    ]);
  });

  describe('new dataset button', () => {
    it('allows admins to see new button', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      const app = await load('/projects/1/entity-lists');
      app.find('#dataset-list-new-button').exists().should.be.true();
    });

    it('does not allow project viewers to see new button', async () => {
      mockLogin({ role: 'viewer' });
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      const app = await load('/projects/1/entity-lists');
      app.find('#dataset-list-new-button').exists().should.be.false();
    });
  });
});
