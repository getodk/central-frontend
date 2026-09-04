import useRequest from '../../src/composables/request';
import { createActorPropertyCreator } from '../../src/composables/actor-property-creator';

import createTestContainer from '../util/container';
import testData from '../data';
import { mockHttp } from '../util/http';
import { testRequestData } from '../util/request-data';
import { withSetup } from '../util/lifecycle';

const setup = () => {
  const container = createTestContainer({
    requestData: testRequestData(['actorProperties'], {
      project: testData.extendedProjects.last(),
      actorProperties: testData.actorProperties.sorted()
    })
  });
  const creator = withSetup(
    () => {
      const { request } = useRequest();
      return createActorPropertyCreator(request);
    },
    { container }
  );
  return { container, creator };
};

describe('createActorPropertyCreator()', () => {
  beforeEach(() => {
    testData.extendedProjects.createPast(1);
  });

  it('adds properties to create', () => {
    const { creator } = setup();
    creator.add('foo');
    creator.add('bar');
    expect(creator.newProperties).to.eql(['foo', 'bar']);
  });

  it('returns existing and new properties', () => {
    testData.actorProperties.createPast(1, { name: 'foo' });
    const { creator } = setup();
    creator.add('bar');
    creator.allProperties.should.eql(['foo', 'bar']);
  });

  it('sends the correct requests', () => {
    const { container, creator } = setup();
    return mockHttp(container)
      .request(() => {
        creator.add('foo');
        creator.add('bar');
        return creator.request();
      })
      .respondWithSuccess()
      .respondWithSuccess()
      .testRequests([
        {
          method: 'POST',
          url: '/v1/projects/1/actor-properties',
          data: { name: 'foo' }
        },
        {
          method: 'POST',
          url: '/v1/projects/1/actor-properties',
          data: { name: 'bar' }
        }
      ]);
  });

  it('resets after clear() is called', () => {
    testData.actorProperties.createPast(1, { name: 'foo' });
    const { container, creator } = setup();
    const { actorProperties } = container.requestData.localResources;
    return mockHttp(container)
      .request(() => {
        creator.add('bar');
        return creator.request();
      })
      .respondWithSuccess()
      .afterResponse(() => {
        expect(creator.newProperties).to.eql(['bar']);
        creator.clear();
        expect(creator.newProperties).to.eql([]);
        actorProperties.data.should.eql([{ name: 'foo' }, { name: 'bar' }]);
      });
  });
});
