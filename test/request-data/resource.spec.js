import sinon from 'sinon';
import { isRef, ref } from 'vue';

import { createResource } from '../../src/request-data/resource';
import { noop } from '../../src/util/util';

import createTestContainer from '../util/container';
import testData from '../data';
import { mockHttp } from '../util/http';

describe('createResource()', () => {
  describe('setting data', () => {
    it('updates setAt', () => {
      const projectData = testData.extendedProjects.createNew();
      const { requestData } = createTestContainer();
      should.not.exist(requestData.project.setAt);

      requestData.project.data = projectData;
      requestData.project.setAt.should.be.an.instanceOf(Date);

      const oldSetAt = requestData.project.setAt;
      requestData.project.data = null;
      const newSetAt = requestData.project.setAt;
      newSetAt.should.be.an.instanceOf(Date);
      newSetAt.should.not.equal(oldSetAt);
    });
  });

  describe('request()', () => {
    it('updates setAt', () => {
      const projectData = testData.standardProjects.createNew();
      const container = createTestContainer();
      const { requestData } = container;
      should.not.exist(requestData.project.setAt);
      return mockHttp(container)
        .request(() => requestData.project.request({ url: '/v1/projects/1' }))
        .respondWithData(() => projectData)
        .afterResponse(() => {
          requestData.project.setAt.should.be.an.instanceOf(Date);
        });
    });

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
        const projectData = testData.standardProjects.createNew();
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
            patch.called.should.be.true;
            const [response, resource] = patch.args[0];
            response.status.should.equal(200);
            response.data.should.eql(projectData);
            (resource === requestData.project).should.be.true;
          });
      });

      it('updates patchedAt', () => {
        const projectData = testData.standardProjects.createNew();
        const container = createTestContainer({
          requestData: { project: projectData }
        });
        const { requestData } = container;

        should.not.exist(requestData.project.patchedAt);
        const oldSetAt = requestData.project.setAt;

        return mockHttp(container)
          .request(() => requestData.project.request({
            url: '/v1/projects/1',
            patch: noop
          }))
          .respondWithData(() => projectData)
          .afterResponse(() => {
            requestData.project.patchedAt.should.be.an.instanceOf(Date);
            // It should only update patchedAt, not setAt.
            requestData.project.setAt.should.equal(oldSetAt);
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
            }).should.be.rejected)
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
              requestData.project.awaitingResponse.should.be.false;
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
            requestData.project.awaitingResponse.should.be.false;
          });
      });
    });

    describe('convenience methods for HTTP verbs', () => {
      it('sends the correct request', () => {
        const container = createTestContainer();
        const { project } = container.requestData;
        return mockHttp(container)
          .request(() => project.request.get('/v1/projects/1', {
            // This option should be passed to request() even though it is a
            // request() option, not an axios option.
            extended: true
          }))
          .respondWithData(() => testData.extendedProjects.createNew())
          .testRequests([
            { method: 'GET', url: '/v1/projects/1', extended: true }
          ]);
      });

      it('stores the response', () => {
        const container = createTestContainer();
        const { project } = container.requestData;
        return mockHttp(container)
          .request(() => project.request.get('/v1/projects/1'))
          .respondWithData(() => testData.standardProjects.createNew())
          .afterResponse(() => {
            project.dataExists.should.be.true;
          });
      });
    });
  });

  describe('cancelRequest()', () => {
    it('results in a rejected promise for a successful response', () => {
      const container = createTestContainer();
      const { roles } = container.requestData;
      return mockHttp(container)
        .request(() => roles.request({ url: '/v1/roles' }).should.be.rejected)
        .beforeAnyResponse(() => { roles.cancelRequest(); })
        .respondWithData(() => []);
    });

    it('results in a rejected promise for an error response', () => {
      const container = createTestContainer();
      const { roles } = container.requestData;
      return mockHttp(container)
        .request(() => roles.request({ url: '/v1/roles' }).should.be.rejected)
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
        .afterResponse(() => { roles.dataExists.should.be.false; });
    });

    it('sets awaitingResponse to false', () => {
      const container = createTestContainer();
      const { roles } = container.requestData;
      return mockHttp(container)
        .request(() => roles.request({ url: '/v1/roles' }).catch(noop))
        .beforeAnyResponse(() => { roles.cancelRequest(); })
        .respondWithData(() => [])
        .afterResponse(() => { roles.awaitingResponse.should.be.false; });
    });

    it('does not show an alert', () => {
      const container = createTestContainer();
      const { requestData: { roles }, alert } = container;
      return mockHttp(container)
        .request(() => roles.request({ url: '/v1/roles' }).catch(noop))
        .beforeAnyResponse(() => { roles.cancelRequest(); })
        .respondWithProblem()
        .afterResponse(() => { alert.state.should.be.false; });
    });
  });

  describe('toRefs()', () => {
    it('converts getters to refs', async () => {
      const container = createTestContainer();
      const refProp = ref(false);
      const resource = createResource(container, 'myResource', () => ({
        refProp,
        nonRefProp: 'foo'
      }));
      const refs = resource.toRefs();

      // Test awaitingResponse and setAt.
      const { awaitingResponse, setAt } = refs;
      isRef(awaitingResponse).should.be.true;
      awaitingResponse.value.should.be.false;
      isRef(setAt).should.be.true;
      should.not.exist(setAt.value);
      await mockHttp(container)
        .request(() => resource.request({ url: '/v1/projects/1' }))
        .beforeAnyResponse(() => {
          awaitingResponse.value.should.be.true;
        })
        .respondWithData(() => testData.standardProjects.createNew());
      awaitingResponse.value.should.be.false;
      expect(setAt.value).to.be.an.instanceOf(Date);

      // Test `data`.
      const { data } = refs;
      isRef(data).should.be.true;
      should.exist(data.value);
      data.value.should.equal(resource.data);

      // Test refs added via the setup function (here, refProp).
      isRef(refs.refProp).should.be.true;
      refs.refProp.value.should.be.false;
      refProp.value = true;
      refs.refProp.value.should.be.true;

      // No refs are created from properties without a getter.
      for (const prop of ['resourceName', 'request', 'nonRefProp']) {
        should.exist(resource[prop]);
        should.not.exist(refs[prop]);
      }
    });

    it('returns refs that are read-only or not depending on whether there is a setter', () => {
      const { requestData } = createTestContainer({
        requestData: { project: testData.extendedProjects.createNew() }
      });
      const { awaitingResponse, data } = requestData.project.toRefs();

      // You can't set awaitingResponse because there's no setter on the
      // resource.
      awaitingResponse.value.should.be.false;
      // There's no error on setting awaitingResponse, but Vue does log a
      // warning.
      const warn = sinon.fake();
      sinon.replace(console, 'warn', warn);
      awaitingResponse.value = true;
      warn.called.should.be.true;
      // The value of `true` was ignored.
      awaitingResponse.value.should.be.false;

      // You can set `data` because there is a setter.
      should.exist(data.value);
      data.value = null;
      should.not.exist(data.value);
      should.not.exist(requestData.project.data);
    });
  });
});
