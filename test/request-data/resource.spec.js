import sinon from 'sinon';

import { noop } from '../../src/util/util';

import createTestContainer from '../util/container';
import testData from '../data';
import { mockHttp } from '../util/http';

describe('createResource()', () => {
  describe('request()', () => {
    describe('patch', () => {
      it('throws an error if clear option is true', () => {
        const { requestData } = createTestContainer({
          requestData: { project: testData.extendedProjects.createNew() }
        });
        const request = () => requestData.project.request({
          url: '/v1/projects/1',
          patch: noop,
          clear: true
        });
        request.should.throw();
      });

      it('passes the response and the resource to the callback', () => {
        const projectData = testData.extendedProjects.createNew();
        const container = createTestContainer({
          requestData: { project: projectData }
        });
        const { requestData } = container;
        const patch = sinon.fake();
        return mockHttp(container)
          .request(() => requestData.project.request({
            url: '/v1/projects/1',
            patch
          }))
          .respondWithData(() => projectData)
          .afterResponse(() => {
            patch.called.should.be.true();
            const [response, resource] = patch.args[0];
            response.status.should.equal(200);
            response.data.should.eql(projectData);
            (resource === requestData.project).should.be.true();
          });
      });

      describe('resource is cleared during the request', () => {
        it('returns a rejected promise', () => {
          const projectData = testData.extendedProjects.createNew();
          const container = createTestContainer({
            requestData: { project: projectData }
          });
          const { requestData } = container;
          return mockHttp(container)
            .request(() => requestData.project.request({
              url: '/v1/projects/1',
              patch: noop
            }).should.be.rejected())
            .beforeAnyResponse(() => { requestData.project.data = null; })
            .respondWithData(() => projectData);
        });

        it('sets awaitingResponse to false', () => {
          const projectData = testData.extendedProjects.createNew();
          const container = createTestContainer({
            requestData: { project: projectData }
          });
          const { requestData } = container;
          return mockHttp(container)
            .request(() => requestData.project.request({
              url: '/v1/projects/1',
              patch: noop
            }).catch(noop))
            .beforeAnyResponse(() => { requestData.project.data = null; })
            .respondWithData(() => projectData)
            .afterResponse(() => {
              requestData.project.awaitingResponse.should.be.false();
            });
        });
      });

      it('sets awaitingResponse to false if callback throws an error', () => {
        const projectData = testData.extendedProjects.createNew();
        const container = createTestContainer({
          requestData: { project: projectData }
        });
        const { requestData } = container;
        return mockHttp(container)
          .request(() => requestData.project.request({
            url: '/v1/projects/1',
            patch: () => { throw new Error(); }
          }).catch(noop))
          .respondWithData(() => projectData)
          .afterResponse(() => {
            requestData.project.awaitingResponse.should.be.false();
          });
      });
    });
  });

  describe('cancelRequest()', () => {
    it('results in a rejected promise for a successful response', () => {
      const container = createTestContainer();
      const { roles } = container.requestData;
      return mockHttp(container)
        .request(() => roles.request({ url: '/v1/roles' }).should.be.rejected())
        .beforeAnyResponse(() => { roles.cancelRequest(); })
        .respondWithData(() => []);
    });

    it('results in a rejected promise for an error response', () => {
      const container = createTestContainer();
      const { roles } = container.requestData;
      return mockHttp(container)
        .request(() => roles.request({ url: '/v1/roles' }).should.be.rejected())
        .beforeAnyResponse(() => { roles.cancelRequest(); })
        .respondWithProblem();
    });

    it('does not set data', () => {
      const container = createTestContainer();
      const { roles } = container.requestData;
      return mockHttp(container)
        .request(() => roles.request({ url: '/v1/roles' }).catch(noop))
        .beforeAnyResponse(() => { roles.cancelRequest(); })
        .respondWithData(() => [])
        .afterResponse(() => { roles.dataExists.should.be.false(); });
    });

    it('sets awaitingResponse to false', () => {
      const container = createTestContainer();
      const { roles } = container.requestData;
      return mockHttp(container)
        .request(() => roles.request({ url: '/v1/roles' }).catch(noop))
        .beforeAnyResponse(() => { roles.cancelRequest(); })
        .respondWithData(() => [])
        .afterResponse(() => { roles.awaitingResponse.should.be.false(); });
    });

    it('does not show an alert', () => {
      const container = createTestContainer();
      const { requestData: { roles }, alert } = container;
      return mockHttp(container)
        .request(() => roles.request({ url: '/v1/roles' }).catch(noop))
        .beforeAnyResponse(() => { roles.cancelRequest(); })
        .respondWithProblem()
        .afterResponse(() => { alert.state.should.be.false(); });
    });
  });
});
