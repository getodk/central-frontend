import FormOverview from '../../../src/components/form/overview.vue';
import FormShow from '../../../src/components/form/show.vue';
import Loading from '../../../src/components/loading.vue';
import NotFound from '../../../src/components/not-found.vue';

import testData from '../../data';
import { ago } from '../../../src/util/date-time';
import { fakeSetTimeout } from '../../util/util';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

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
        app.getComponent(FormOverview).vm.should.not.equal(vm);
      });
  });

  it('shows a loading message until all responses are received', () => {
    testData.extendedProjects.createPast(1);
    testData.extendedForms.createPast(1, { xmlFormId: 'f', draft: true });
    testData.standardFormAttachments.createPast(1);
    return load('/projects/1/forms/f/draft/attachments')
      .beforeEachResponse(app => {
        const loading = app.findAllComponents(Loading);
        loading.length.should.equal(2);
        loading.at(0).props().state.should.eql(true);
      })
      .afterResponses(app => {
        const loading = app.findAllComponents(Loading);
        loading.length.should.equal(2);
        loading.at(0).props().state.should.eql(false);
      });
  });

  describe('draft enketoId', () => {
    it('does not fetch the enketoId if the draft has an enketoId', () => {
      testData.extendedForms.createPast(1, { draft: true, enketoId: 'xyz' });
      const { runAll } = fakeSetTimeout();
      return load('/projects/1/forms/f/draft')
        .complete()
        .testNoRequest(runAll);
    });

    it('fetches the enketoId if the draft does not have one', () => {
      testData.extendedForms.createPast(1, { draft: true, enketoId: null });
      const { runAll } = fakeSetTimeout();
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(runAll)
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
          const { formDraft } = app.vm.$store.state.request.data;
          formDraft.get().enketoId.should.equal('xyz');
        })
        .testNoRequest(runAll);
    });

    it('continues to fetch the enketoId if the draft does not have one', () => {
      testData.extendedForms.createPast(1, { draft: true, enketoId: null });
      const { runAll } = fakeSetTimeout();
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(runAll)
        .respondWithData(() => testData.standardFormDrafts.last())
        .complete()
        .request(runAll)
        .respondWithData(() => {
          testData.extendedFormDrafts.update(-1, { enketoId: 'xyz' });
          return testData.standardFormDrafts.last();
        })
        .afterResponse(app => {
          const { formDraft } = app.vm.$store.state.request.data;
          formDraft.get().enketoId.should.equal('xyz');
        });
    });

    it('stops fetching the enketoId after an error response', () => {
      testData.extendedForms.createPast(1, { draft: true, enketoId: null });
      const { runAll } = fakeSetTimeout();
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(runAll)
        .respondWithProblem()
        .complete()
        .testNoRequest(runAll);
    });

    it('does not fetch enketoId if a new request for draft is sent', () => {
      testData.extendedForms.createPast(1, { draft: true, enketoId: null });
      const { runAll } = fakeSetTimeout();
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(app => {
          app.getComponent(FormShow).vm.fetchDraft();
          runAll();
        })
        // There should be only two responses, not three.
        .respondWithProblem(() => testData.extendedFormDrafts.last())
        .respondWithProblem(() => testData.standardFormAttachments.sorted());
    });

    describe('route change', () => {
      it('continues to fetch enketoId as user navigates within form', () => {
        testData.extendedForms.createPast(1, { draft: true, enketoId: null });
        testData.standardFormAttachments.createPast(1);
        const { runAll } = fakeSetTimeout();
        return load('/projects/1/forms/f/draft')
          .complete()
          .route('/projects/1/forms/f/draft/attachments')
          .complete()
          .request(runAll)
          .respondWithData(() => testData.standardFormDrafts.last());
      });

      it('stops fetching enketoId if user navigates to a form draft with an enketoId', () => {
        testData.extendedForms
          .createPast(1, { xmlFormId: 'f', draft: true, enketoId: null })
          .createPast(1, { xmlFormId: 'f2', draft: true, enketoId: 'xyz' });
        const { runAll } = fakeSetTimeout();
        return load('/projects/1/forms/f/draft', {}, {
          form: () => testData.extendedForms.first(),
          formDraft: () => testData.extendedFormDrafts.first()
        })
          .complete()
          .load('/projects/1/forms/f2/draft', { project: false })
          .complete()
          .testNoRequest(runAll);
      });

      it('stops fetching enketoId if user navigates somewhere other than a form route', () => {
        testData.extendedForms.createPast(1, { draft: true, enketoId: null });
        const { runAll } = fakeSetTimeout();
        return load('/projects/1/forms/f/draft')
          .complete()
          .load('/account/edit')
          .complete()
          .testNoRequest(runAll);
      });
    });
  });

  describe('form enketoId', () => {
    it('does not fetch the enketoId if the form has an enketoId', () => {
      testData.extendedForms.createPast(1, { enketoId: 'xyz' });
      const { runAll } = fakeSetTimeout();
      return load('/projects/1/forms/f')
        .complete()
        .testNoRequest(runAll);
    });

    it('does not fetch enketoId for form published more than 15 minutes ago', () => {
      testData.extendedForms.createPast(1, {
        enketoId: null,
        publishedAt: ago({ minutes: 16 }).toISO()
      });
      const { runAll } = fakeSetTimeout();
      return load('/projects/1/forms/f')
        .complete()
        .testNoRequest(runAll);
    });

    it('fetches the enketoId if a recently published form does not have one', () => {
      testData.extendedForms.createPast(1, {
        enketoId: null,
        publishedAt: new Date().toISOString()
      });
      const { runAll } = fakeSetTimeout();
      return load('/projects/1/forms/f')
        .complete()
        .request(runAll)
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
          const { form } = app.vm.$store.state.request.data;
          form.enketoId.should.equal('xyz');
        })
        .testNoRequest(runAll);
    });

    it('continues to fetch enketoId if form still does not have one', () => {
      testData.extendedForms.createPast(1, {
        enketoId: null,
        publishedAt: new Date().toISOString()
      });
      const { runAll } = fakeSetTimeout();
      return load('/projects/1/forms/f')
        .complete()
        .request(runAll)
        .respondWithData(() => testData.standardForms.last())
        .complete()
        .request(runAll)
        .respondWithData(() => {
          testData.extendedForms.update(-1, { enketoId: 'xyz' });
          return testData.standardForms.last();
        })
        .afterResponse(app => {
          const { form } = app.vm.$store.state.request.data;
          form.enketoId.should.equal('xyz');
        });
    });

    it('stops fetching the enketoId after an error response', () => {
      testData.extendedForms.createPast(1, {
        enketoId: null,
        publishedAt: new Date().toISOString()
      });
      const { runAll } = fakeSetTimeout();
      return load('/projects/1/forms/f')
        .complete()
        .request(runAll)
        .respondWithProblem()
        .complete()
        .testNoRequest(runAll);
    });

    it('does not fetch enketoId if a new request for form is sent', () => {
      testData.extendedForms.createPast(1, {
        enketoId: null,
        publishedAt: new Date().toISOString()
      });
      const { runAll } = fakeSetTimeout();
      return load('/projects/1/forms/f')
        .complete()
        .request(app => {
          app.getComponent(FormShow).vm.fetchForm();
          runAll();
        })
        // There should be only one response, not two.
        .respondWithData(() => testData.extendedForms.last());
    });

    it('sends two requests if form and draft both do not have an enketoId', () => {
      testData.extendedForms.createPast(1, {
        enketoId: null,
        publishedAt: new Date().toISOString()
      });
      testData.extendedFormDrafts.createPast(1, { draft: true, enketoId: null });
      const { runAll } = fakeSetTimeout();
      return load('/projects/1/forms/f')
        .complete()
        .request(runAll)
        .respondWithData(() => {
          testData.extendedForms.update(0, { enketoId: 'xyz' });
          return testData.standardForms.last();
        })
        .respondWithData(() => {
          testData.extendedFormDrafts.update(1, { enketoId: 'abc' });
          return testData.standardFormDrafts.last();
        })
        .afterResponses(app => {
          const { form, formDraft } = app.vm.$store.state.request.data;
          form.enketoId.should.equal('xyz');
          formDraft.get().enketoId.should.equal('abc');
        })
        .testNoRequest(runAll);
    });

    describe('enketoOnceId', () => {
      it('fetches the enketoOnceId', () => {
        testData.extendedForms.createPast(1, {
          enketoId: 'xyz',
          enketoOnceId: null,
          publishedAt: new Date().toISOString()
        });
        const { runAll } = fakeSetTimeout();
        return load('/projects/1/forms/f')
          .complete()
          .request(runAll)
          .respondWithData(() => {
            testData.extendedForms.update(-1, { enketoOnceId: 'zyx' });
            return testData.standardForms.last();
          })
          .afterResponse(app => {
            const { form } = app.vm.$store.state.request.data;
            form.enketoOnceId.should.equal('zyx');
          })
          .testNoRequest(runAll);
      });
    });

    it('continues to fetch the enketoOnceId', () => {
      testData.extendedForms.createPast(1, {
        enketoId: 'xyz',
        enketoOnceId: null,
        publishedAt: new Date().toISOString()
      });
      const { runAll } = fakeSetTimeout();
      return load('/projects/1/forms/f')
        .complete()
        .request(runAll)
        .respondWithData(() => testData.standardForms.last())
        .complete()
        .request(runAll)
        .respondWithData(() => {
          testData.extendedForms.update(-1, { enketoOnceId: 'zyx' });
          return testData.standardForms.last();
        })
        .afterResponse(app => {
          const { form } = app.vm.$store.state.request.data;
          form.enketoOnceId.should.equal('zyx');
        });
    });
  });
});
