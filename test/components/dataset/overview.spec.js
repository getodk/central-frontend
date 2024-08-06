import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('DatasetOverview', () => {
  describe('new property button', () => {
    it('allows admins to see new property button', async () => {
      mockLogin({ role: 'admin' });
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      const app = await load('/projects/1/entity-lists/trees');
      app.find('#dataset-property-new-button').exists().should.be.true;
    });

    it('does not allow project viewers to see new property button', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer' });
      testData.extendedDatasets.createPast(1, { name: 'trees' });
      const app = await load('/projects/1/entity-lists/trees');
      app.find('#dataset-property-new-button').exists().should.be.false;
    });
  });
});
