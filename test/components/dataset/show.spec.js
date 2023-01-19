import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

import DatasetOverview from '../../../src/components/dataset/overview.vue';
import testData from '../../data';

describe('DatasetShow', () => {
  beforeEach(mockLogin);

  it('sends the correct initial requests', () => {
    testData.extendedDatasets.createPast(1, { name: 'a b' });
    return load('/projects/1/datasets/a%20b').testRequests([
      { url: '/v1/projects/1', extended: true },
      { url: '/v1/projects/1/datasets/a%20b' }
    ]);
  });

  it('shows the correct title', () =>
    load('/projects/1/datasets/trees').then(app => {
      const title = app.get('#page-head-title');
      title.text().should.be.equal('trees');
    }));

  it('re-renders the router view after a route change', () => {
    testData.extendedDatasets
      .createPast(1, { name: 'trees' })
      .createPast(1, { name: 'shovels' });
    let vm;
    return load('/projects/1/datasets/trees', {}, {
      dataset: () => testData.extendedDatasets.first()
    })
      .afterResponses(app => {
        vm = app.getComponent(DatasetOverview);
      })
      .load('/projects/1/datasets/shovels', {
        dataset: () => testData.extendedDatasets.last(),
        project: false
      })
      .afterResponses(app => {
        should(app.getComponent(DatasetOverview).vm).not.equal(vm);
      });
  });
});
