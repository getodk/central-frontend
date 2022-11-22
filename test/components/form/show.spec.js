import sinon from 'sinon';

import FormOverview from '../../../src/components/form/overview.vue';
import FormShow from '../../../src/components/form/show.vue';
import Loading from '../../../src/components/loading.vue';
import NotFound from '../../../src/components/not-found.vue';

import { ago } from '../../../src/util/date-time';

import testData from '../../data';
import { block } from '../../util/util';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockResponse } from '../../util/axios';

describe('FormShow', () => {
  beforeEach(mockLogin);

  it('requires the projectId route param to be integer', async () => {
    const app = await load('/projects/p/forms/f');
    app.findComponent(NotFound).exists().should.be.true();
  });

  it('sends the correct initial requests', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
    return load('/projects/1/forms/a%20b').testRequests([
      { url: '/v1/projects/1', extended: true },
      { url: '/v1/projects/1/forms/a%20b', extended: true },
      { url: '/v1/projects/1/forms/a%20b/draft', extended: true },
      { url: '/v1/projects/1/forms/a%20b/draft/attachments' }
    ]);
  });

  describe('requestData reconciliation', () => {
    it('updates attachments if it is defined but formDraft is not', async () => {
      testData.extendedForms.createPast(1);
      const attachments = testData.standardFormAttachments.createPast(1).sorted();
      const app = await load('/projects/1/forms/f', {}, {
        attachments: () => attachments
      });
      app.vm.$container.requestData.attachments.isEmpty().should.be.true();
    });

    it('updates formDraft if it is defined but attachments is not', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      const app = await load('/projects/1/forms/f', {}, {
        attachments: () => mockResponse.problem(404.1)
      });
      app.vm.$container.requestData.formDraft.isEmpty().should.be.true();
    });
  });

  it('re-renders the router view after a route change', () => {
    testData.extendedForms
      .createPast(1, { xmlFormId: 'f1' })
      .createPast(1, { xmlFormId: 'f2' });
    let vm;
    return load('/projects/1/forms/f1', {}, {
      form: () => testData.extendedForms.first()
    })
      .afterResponses(app => {
        vm = app.getComponent(FormOverview).vm;
      })
      .load('/projects/1/forms/f2', {
        project: false,
        form: () => testData.extendedForms.last()
      })
      .afterResponses(app => {
        should(app.getComponent(FormOverview).vm).not.equal(vm);
      });
  });

  it('shows a loading message until all responses are received', () => {
    testData.extendedProjects.createPast(1);
    testData.extendedForms.createPast(1, { xmlFormId: 'f', draft: false });
    testData.standardFormAttachments.createPast(1);
    return load('/projects/1/forms/f')
      .beforeEachResponse(app => {
        const loading = app.findAllComponents(Loading);
        loading.length.should.equal(2);
        loading[0].props().state.should.eql(true);
      })
      .afterResponses(app => {
        const loading = app.findAllComponents(Loading);
        loading.length.should.equal(2);
        loading[0].props().state.should.eql(false);
      });
  });

  describe('draft enketoId', () => {
    it('does not fetch the enketoId if the draft has an enketoId', () => {
      const clock = sinon.useFakeTimers(Date.now());
      testData.extendedForms.createPast(1, { draft: true, enketoId: 'xyz' });
      return load('/projects/1/forms/f/draft')
        .complete()
        .testNoRequest(() => {
          clock.tick(3000);
        });
    });

    it('fetches the enketoId if the draft does not have one', () => {
      const clock = sinon.useFakeTimers(Date.now());
      testData.extendedForms.createPast(1, { draft: true, enketoId: null });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(() => {
          clock.tick(3000);
        })
        .beforeEachResponse((_, { method, url, headers }) => {
          method.should.equal('GET');
          url.should.equal('/v1/projects/1/forms/f/draft');
          should.not.exist(headers['X-Extended-Metadata']);
        })
        .respondWithData(() => {
          testData.extendedFormDrafts.update(-1, { enketoId: 'xyz' });
          return testData.standardFormDrafts.last();
        })
        .afterResponse(app => {
          const { formDraft } = app.vm.$container.requestData;
          formDraft.get().enketoId.should.equal('xyz');
        })
        .testNoRequest(() => {
          clock.tick(3000);
        });
    });

    it('continues to fetch the enketoId if the draft does not have one', () => {
      const clock = sinon.useFakeTimers(Date.now());
      testData.extendedForms.createPast(1, { draft: true, enketoId: null });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(() => {
          clock.tick(3000);
        })
        .respondWithData(() => testData.standardFormDrafts.last())
        .complete()
        .request(() => {
          clock.tick(3000);
        })
        .respondWithData(() => {
          testData.extendedFormDrafts.update(-1, { enketoId: 'xyz' });
          return testData.standardFormDrafts.last();
        })
        .afterResponse(app => {
          const { formDraft } = app.vm.$container.requestData;
          formDraft.get().enketoId.should.equal('xyz');
        });
    });

    it('stops fetching the enketoId after an error response', () => {
      const clock = sinon.useFakeTimers(Date.now());
      testData.extendedForms.createPast(1, { draft: true, enketoId: null });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(() => {
          clock.tick(3000);
        })
        .respondWithProblem()
        .complete()
        .testNoRequest(() => {
          clock.tick(3000);
        });
    });

    it('stops fetching the enketoId if there is no longer a draft', () => {
      const clock = sinon.useFakeTimers(Date.now());
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, {
        draft: true,
        enketoId: null
      });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(async (app) => {
          await app.get('#form-draft-status-abandon-button').trigger('click');
          return app.get('#form-draft-abandon .btn-danger').trigger('click');
        })
        .respondWithSuccess()
        .complete()
        .testNoRequest(() => {
          clock.tick(3000);
        });
    });

    it('stops fetching enketoId if draft was deleted by concurrent request', () => {
      const clock = sinon.useFakeTimers(Date.now());
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, {
        draft: true,
        enketoId: null
      });
      const [lock, unlock] = block();
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(async (app) => {
          await app.get('#form-draft-status-abandon-button').trigger('click');
          // We will wait for the navigation to the form overview before
          // returning the response for the form draft.
          app.vm.$router.afterEach(unlock);
          return app.get('#form-draft-abandon .btn-danger').trigger('click');
        })
        .beforeEachResponse(async (_, { method }) => {
          if (method === 'DELETE')
            clock.tick(3000);
          else
            await lock;
        })
        .respondWithSuccess()
        .respondWithData(() => testData.standardFormDrafts.last())
        .complete()
        .testNoRequest(() => {
          clock.tick(3000);
        });
    });

    it('does not fetch enketoId during a new request for draft', () => {
      const clock = sinon.useFakeTimers(Date.now());
      testData.extendedForms.createPast(1, { draft: true, enketoId: null });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(app => {
          app.getComponent(FormShow).vm.fetchDraft();
          clock.tick(3000);
        })
        // There should be only two responses, not three.
        .respondWithProblem(() => testData.extendedFormDrafts.last())
        .respondWithProblem(() => testData.standardFormAttachments.sorted());
    });

    describe('route change', () => {
      it('continues to fetch enketoId as user navigates within form', () => {
        const clock = sinon.useFakeTimers(Date.now());
        testData.extendedForms.createPast(1, { draft: true, enketoId: null });
        testData.standardFormAttachments.createPast(1);
        return load('/projects/1/forms/f/draft')
          .complete()
          .route('/projects/1/forms/f/draft/attachments')
          .complete()
          .request(() => {
            clock.tick(3000);
          })
          .respondWithData(() => testData.standardFormDrafts.last());
      });

      it('stops fetching enketoId if user navigates to a form draft with an enketoId', () => {
        const clock = sinon.useFakeTimers(Date.now());
        testData.extendedForms
          .createPast(1, { xmlFormId: 'f', draft: true, enketoId: null })
          .createPast(1, { xmlFormId: 'f2', draft: true, enketoId: 'xyz' });
        return load('/projects/1/forms/f/draft', {}, {
          form: () => testData.extendedForms.first(),
          formDraft: () => testData.extendedFormDrafts.first()
        })
          .complete()
          .load('/projects/1/forms/f2/draft', { project: false })
          .complete()
          .testNoRequest(() => {
            clock.tick(3000);
          });
      });

      it('stops fetching enketoId if user navigates somewhere other than a form route', () => {
        const clock = sinon.useFakeTimers(Date.now());
        testData.extendedForms.createPast(1, { draft: true, enketoId: null });
        return load('/projects/1/forms/f/draft')
          .complete()
          .load('/account/edit')
          .complete()
          .testNoRequest(() => {
            clock.tick(3000);
          });
      });
    });
  });

  describe('form enketoId', () => {
    it('does not fetch the enketoId if the form has an enketoId', () => {
      const clock = sinon.useFakeTimers(Date.now());
      testData.extendedForms.createPast(1, { enketoId: 'xyz' });
      return load('/projects/1/forms/f')
        .complete()
        .testNoRequest(() => {
          clock.tick(3000);
        });
    });

    it('does not fetch enketoId for form published more than 15 minutes ago', () => {
      const clock = sinon.useFakeTimers(Date.now());
      testData.extendedForms.createPast(1, {
        enketoId: null,
        publishedAt: ago({ minutes: 16 }).toISO()
      });
      return load('/projects/1/forms/f')
        .complete()
        .testNoRequest(() => {
          clock.tick(3000);
        });
    });

    it('fetches the enketoId if a recently published form does not have one', () => {
      const clock = sinon.useFakeTimers(Date.now());
      testData.extendedForms.createPast(1, {
        enketoId: null,
        publishedAt: new Date().toISOString()
      });
      return load('/projects/1/forms/f')
        .complete()
        .request(() => {
          clock.tick(3000);
        })
        .beforeEachResponse((_, { method, url, headers }) => {
          method.should.equal('GET');
          url.should.equal('/v1/projects/1/forms/f');
          should.not.exist(headers['X-Extended-Metadata']);
        })
        .respondWithData(() => {
          testData.extendedForms.update(-1, { enketoId: 'xyz' });
          return testData.standardForms.last();
        })
        .afterResponse(app => {
          const { form } = app.vm.$container.requestData;
          form.enketoId.should.equal('xyz');
        })
        .testNoRequest(() => {
          clock.tick(3000);
        });
    });

    it('continues to fetch enketoId if form still does not have one', () => {
      const clock = sinon.useFakeTimers(Date.now());
      testData.extendedForms.createPast(1, {
        enketoId: null,
        publishedAt: new Date().toISOString()
      });
      return load('/projects/1/forms/f')
        .complete()
        .request(() => {
          clock.tick(3000);
        })
        .respondWithData(() => testData.standardForms.last())
        .complete()
        .request(() => {
          clock.tick(3000);
        })
        .respondWithData(() => {
          testData.extendedForms.update(-1, { enketoId: 'xyz' });
          return testData.standardForms.last();
        })
        .afterResponse(app => {
          const { form } = app.vm.$container.requestData;
          form.enketoId.should.equal('xyz');
        });
    });

    it('stops fetching the enketoId after an error response', () => {
      const clock = sinon.useFakeTimers(Date.now());
      testData.extendedForms.createPast(1, {
        enketoId: null,
        publishedAt: new Date().toISOString()
      });
      return load('/projects/1/forms/f')
        .complete()
        .request(() => {
          clock.tick(3000);
        })
        .respondWithProblem()
        .complete()
        .testNoRequest(() => {
          clock.tick(3000);
        });
    });

    it('does not fetch the enketoId during a new request for the form', () => {
      const clock = sinon.useFakeTimers(Date.now());
      testData.extendedForms.createPast(1, {
        enketoId: null,
        publishedAt: new Date().toISOString()
      });
      return load('/projects/1/forms/f')
        .complete()
        .request(app => {
          app.getComponent(FormShow).vm.fetchForm();
          clock.tick(3000);
        })
        // There should be only one response, not two.
        .respondWithData(() => testData.extendedForms.last());
    });

    it('sends two requests if form and draft both do not have an enketoId', () => {
      const clock = sinon.useFakeTimers(Date.now());
      testData.extendedForms.createPast(1, {
        enketoId: null,
        publishedAt: new Date().toISOString()
      });
      testData.extendedFormDrafts.createPast(1, { draft: true, enketoId: null });
      return load('/projects/1/forms/f')
        .complete()
        .request(() => {
          clock.tick(3000);
        })
        .respondWithData(() => {
          testData.extendedForms.update(0, { enketoId: 'xyz' });
          return testData.standardForms.last();
        })
        .respondWithData(() => {
          testData.extendedFormDrafts.update(1, { enketoId: 'abc' });
          return testData.standardFormDrafts.last();
        })
        .afterResponses(app => {
          const { form, formDraft } = app.vm.$container.requestData;
          form.enketoId.should.equal('xyz');
          formDraft.get().enketoId.should.equal('abc');
        })
        .testNoRequest(() => {
          clock.tick(3000);
        });
    });

    describe('enketoOnceId', () => {
      it('fetches the enketoOnceId', () => {
        const clock = sinon.useFakeTimers(Date.now());
        testData.extendedForms.createPast(1, {
          enketoId: 'xyz',
          enketoOnceId: null,
          publishedAt: new Date().toISOString()
        });
        return load('/projects/1/forms/f')
          .complete()
          .request(() => {
            clock.tick(3000);
          })
          .respondWithData(() => {
            testData.extendedForms.update(-1, { enketoOnceId: 'zyx' });
            return testData.standardForms.last();
          })
          .afterResponse(app => {
            const { form } = app.vm.$container.requestData;
            form.enketoOnceId.should.equal('zyx');
          })
          .testNoRequest(() => {
            clock.tick(3000);
          });
      });
    });

    it('continues to fetch the enketoOnceId', () => {
      const clock = sinon.useFakeTimers(Date.now());
      testData.extendedForms.createPast(1, {
        enketoId: 'xyz',
        enketoOnceId: null,
        publishedAt: new Date().toISOString()
      });
      return load('/projects/1/forms/f')
        .complete()
        .request(() => {
          clock.tick(3000);
        })
        .respondWithData(() => testData.standardForms.last())
        .complete()
        .request(() => {
          clock.tick(3000);
        })
        .respondWithData(() => {
          testData.extendedForms.update(-1, { enketoOnceId: 'zyx' });
          return testData.standardForms.last();
        })
        .afterResponse(app => {
          const { form } = app.vm.$container.requestData;
          form.enketoOnceId.should.equal('zyx');
        });
    });
  });
});
