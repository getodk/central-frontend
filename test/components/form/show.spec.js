import FormOverview from '../../../src/components/form/overview.vue';
import FormShow from '../../../src/components/form/show.vue';
import Loading from '../../../src/components/loading.vue';
import NotFound from '../../../src/components/not-found.vue';
import testData from '../../data';
import { ago } from '../../../src/util/date-time';
import { fakeSetTimeout } from '../../util/util';
import { load, mockRoute } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormShow', () => {
  beforeEach(mockLogin);

  describe('route params', () => {
    it('requires projectId param to be integer', () =>
      mockRoute('/projects/p/forms/f')
        .then(app => {
          app.find(NotFound).length.should.equal(1);
        }));

    it('handles an encoded xmlFormId correctly', () =>
      mockRoute('/projects/1/forms/i%20%C4%B1')
        .beforeEachResponse((app, request, index) => {
          if (index === 1) request.url.should.equal('/v1/projects/1/forms/i%20%C4%B1');
        })
        .respondWithData(() =>
          testData.extendedProjects.createPast(1, { forms: 1 }).last())
        .respondWithData(() =>
          testData.extendedForms.createPast(1, { xmlFormId: 'i ı' }).last())
        .respondWithProblem(404.1) // formDraft
        .respondWithProblem(404.1) // attachments
        .respondWithData(() => []) // formActors
        .afterResponses(app => {
          app.vm.$route.params.xmlFormId.should.equal('i ı');
        }));
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
        // eslint-disable-next-line prefer-destructuring
        vm = app.first(FormOverview).vm;
      })
      .load('/projects/1/forms/f2', {
        project: false,
        form: () => testData.extendedForms.last()
      })
      .afterResponses(app => {
        app.first(FormOverview).vm.should.not.equal(vm);
      });
  });

  it('shows a loading message until all responses are received', () =>
    mockRoute('/projects/1/forms/f/draft/attachments')
      .beforeEachResponse(app => {
        const loading = app.find(Loading);
        loading.length.should.equal(1);
        loading[0].getProp('state').should.eql(true);
      })
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() => testData.extendedForms
        .createPast(1, { xmlFormId: 'f', draft: true })
        .last())
      .respondWithData(() => testData.extendedFormDrafts.last())
      .respondWithData(() =>
        testData.standardFormAttachments.createPast(1).sorted())
      .afterResponses(app => {
        const loading = app.find(Loading);
        loading.length.should.equal(1);
        loading[0].getProp('state').should.eql(false);
      }));

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
          app.first(FormShow).vm.fetchDraft();
          runAll();
        })
        // There should be only two responses, not three.
        .respondWithProblem(() => testData.extendedFormDrafts.last())
        .respondWithProblem(() => testData.standardFormAttachments.sorted());
    });

    it('updates the enketoId of a form without a published version', () => {
      testData.extendedForms.createPast(1, { draft: true, enketoId: null });
      const { runAll } = fakeSetTimeout();
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(runAll)
        .respondWithData(() => {
          testData.extendedFormDrafts.update(-1, { enketoId: 'xyz' });
          return testData.standardFormDrafts.last();
        })
        .afterResponse(app => {
          const { form } = app.vm.$store.state.request.data;
          form.enketoId.should.equal('xyz');
        });
    });

    it('does not update enketoId of form with a published version', () => {
      testData.extendedForms.createPast(1, { enketoId: 'xyz' });
      testData.extendedFormVersions.createPast(1, { draft: true, enketoId: null });
      const { runAll } = fakeSetTimeout();
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(runAll)
        .respondWithData(() => {
          testData.extendedFormDrafts.update(-1, { enketoId: 'abc' });
          return testData.standardFormDrafts.last();
        })
        .afterResponse(app => {
          const { form, formDraft } = app.vm.$store.state.request.data;
          form.enketoId.should.equal('xyz');
          formDraft.get().enketoId.should.equal('abc');
        });
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
          app.first(FormShow).vm.fetchForm();
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
