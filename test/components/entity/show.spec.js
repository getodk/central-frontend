import NotFound from '../../../src/components/not-found.vue';
import PageBack from '../../../src/components/page/back.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('EntityShow', () => {
  beforeEach(mockLogin);

  it('requires the projectId route param to be integer', async () => {
    const component = await load('/projects/p/datasets/trees/entities/e', {
      root: false
    });
    component.findComponent(NotFound).exists().should.be.true();
  });

  it('validates the uuid route param', async () => {
    const component = await load('/projects/1/datasets/trees/entities/e f', {
      root: false
    });
    component.findComponent(NotFound).exists().should.be.true();
  });

  it('sends the correct initial requests', () => {
    testData.extendedDatasets.createPast(1, { name: 'á', entities: 1 });
    testData.extendedEntities.createPast(1, { uuid: 'e' });
    return load('/projects/1/datasets/%C3%A1/entities/e', { root: false })
      .testRequests([
        { url: '/v1/projects/1/datasets/%C3%A1/entities/e', extended: true },
        { url: '/v1/projects/1', extended: true },
        { url: '/v1/projects/1/datasets/%C3%A1', extended: true },
        { url: '/v1/projects/1/datasets/%C3%A1/entities/e/audits' },
        { url: '/v1/projects/1/datasets/%C3%A1/entities/e/diffs' }
      ]);
  });

  it('renders a back link', async () => {
    testData.extendedDatasets.createPast(1, { name: 'á', entities: 1 });
    testData.extendedEntities.createPast(1, { uuid: 'e' });
    const component = await load('/projects/1/datasets/%C3%A1/entities/e', {
      root: false
    });
    const back = component.getComponent(PageBack);
    back.props().to.should.equal('/projects/1/datasets/%C3%A1/entities');
    back.get('#page-back-back').text().should.equal('Back to á Table');
  });

  it('shows the entity label', async () => {
    testData.extendedEntities.createPast(1, { uuid: 'e', label: 'My Entity' });
    const component = await load('/projects/1/datasets/trees/entities/e', {
      root: false
    });
    component.get('#page-head-title').text().should.equal('My Entity');
  });
});
