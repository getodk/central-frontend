import usePropertyCreator from '../../src/composables/property-creator';
import useRequest from '../../src/composables/request';

import createTestContainer from '../util/container';
import { mockHttp } from '../util/http';
import { withSetup } from '../util/lifecycle';

const setup = () => {
  const container = createTestContainer();
  const creator = withSetup(
    () => {
      const { request } = useRequest();
      return usePropertyCreator(request);
    },
    { container }
  );
  return { container, creator };
};

describe('usePropertyCreator()', () => {
  it('sends requests', () => {
    const { container, creator } = setup();
    return mockHttp(container)
      .request(() =>
        creator.request('/v1/properties', ['foo', 'bar'], ['name']))
      .respondWithSuccess()
      .respondWithSuccess()
      .testRequests([
        {
          method: 'POST',
          url: '/v1/properties',
          data: { name: 'foo' }
        },
        {
          method: 'POST',
          url: '/v1/properties',
          data: { name: 'bar' }
        }
      ])
      .afterResponses(() => {
        [...creator.created].should.eql(['foo', 'bar']);
      });
  });

  it('does not attempt to recreate a property that it has already created', () => {
    const { container, creator } = setup();
    const create = () => creator.request('/v1/properties', ['foo', 'bar'], ['name']);
    return mockHttp(container)
      .request(() => create().should.be.rejected)
      .respondWithSuccess()
      .respondWithProblem()
      .afterResponses(() => {
        [...creator.created].should.eql(['foo']);
      })
      .request(create)
      .respondWithSuccess()
      .testRequests([{
        method: 'POST',
        url: '/v1/properties',
        data: { name: 'bar' }
      }])
      .afterResponses(() => {
        [...creator.created].should.eql(['foo', 'bar']);
      });
  });

  describe('409.3 response', () => {
    it('treats a 409.3 like a success if it has the expected fields', () => {
      const { container, creator } = setup();
      return mockHttp(container)
        .request(() => creator.request('/v1/properties', ['foo'], ['name']))
        .respondWithProblem({
          code: 409.3,
          message: 'A resource already exists with name of foo.',
          details: { fields: ['name'], values: ['foo'] }
        })
        .afterResponse(() => {
          [...creator.created].should.eql(['foo']);
        });
    });

    it('returns a rejected promise if the 409.3 fields are unexpected', () => {
      const { container, creator } = setup();
      return mockHttp(container)
        .request(() => {
          const promise = creator.request('/v1/properties', ['foo'], ['name']);
          return promise.should.be.rejected;
        })
        .respondWithProblem({
          code: 409.3,
          message: 'A resource already exists with unexpected_field of bar.',
          details: { fields: ['unexpected_field'], values: ['bar'] }
        })
        .afterResponse(() => {
          creator.created.size.should.equal(0);
        });
    });
  });

  it('clears created', () => {
    const { container, creator } = setup();
    return mockHttp(container)
      .request(() => creator.request('/v1/properties', ['foo'], ['name']))
      .respondWithSuccess()
      .afterResponses(() => {
        creator.created.size.should.equal(1);
        creator.clear();
        creator.created.size.should.equal(0);
      });
  });
});
