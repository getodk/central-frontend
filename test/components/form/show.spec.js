import Loading from '../../../src/components/loading.vue';
import NotFound from '../../../src/components/not-found.vue';
import testData from '../../data';
import { mockLogin } from '../../session';
import { mockRoute } from '../../http';

describe('FormShow', () => {
  describe('route params', () => {
    it('requires projectId param to be integer', () =>
      mockRoute('/projects/p/forms/f')
        .then(app => {
          app.find(NotFound).length.should.equal(1);
        }));

    it('handles encoded xmlFormId correctly', () => {
      mockLogin();
      const { project, form } = testData.createProjectAndFormWithoutSubmissions({
        form: { xmlFormId: 'a b' }
      });
      return mockRoute('/projects/1/forms/a%20b')
        .beforeEachResponse((app, request, index) => {
          if (index === 1) request.url.should.equal('/v1/projects/1/forms/a%20b');
        })
        .respondWithData(() => project)
        .respondWithData(() => form)
        .respondWithData(() => testData.extendedFormAttachments.sorted())
        .respondWithData(() => []) // assignmentActors
        .afterResponses(app => {
          app.vm.$route.params.xmlFormId.should.equal('a b');
        });
    });
  });

  it("shows the project's name", () => {
    mockLogin();
    return mockRoute('/projects/1/forms/f')
      .respondWithData(() =>
        testData.extendedProjects.createPast(1, { name: 'My Project' }).last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .respondWithData(() => []) // assignmentActors
      .afterResponses(app => {
        const text = app.first('#page-head-context span').text().trim();
        text.should.equal('My Project');
      });
  });

  it("appends (archived) to an archived project's name", () => {
    mockLogin();
    return mockRoute('/projects/1/forms/f')
      .respondWithData(() => testData.extendedProjects
        .createPast(1, { name: 'My Project', archived: true })
        .last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .respondWithData(() => []) // assignmentActors
      .afterResponses(app => {
        const text = app.first('#page-head-context span').text().trim();
        text.should.equal('My Project (archived)');
      });
  });

  it("renders the project's name as a link", () => {
    mockLogin();
    return mockRoute('/projects/1/forms/f')
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .respondWithData(() => []) // assignmentActors
      .afterResponses(app => {
        const a = app.first('#page-head-context span a');
        a.getAttribute('href').should.equal('#/projects/1');
      });
  });

  it('shows a link back to the project overview', () => {
    mockLogin();
    return mockRoute('/projects/1/forms/f')
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .respondWithData(() => []) // assignmentActors
      .afterResponses(app => {
        const a = app.find('#page-head-context a');
        a.length.should.equal(2);
        a[1].getAttribute('href').should.equal('#/projects/1');
      });
  });

  it("shows the form's name", () => {
    mockLogin();
    return mockRoute('/projects/1/forms/f')
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .respondWithData(() => []) // assignmentActors
      .afterResponses(app => {
        const title = app.first('#page-head-title').text().trim();
        const form = testData.extendedForms.last();
        title.should.equal(form.name != null ? form.name : form.xmlFormId);
      });
  });

  it('shows a loading message until all responses are received', () => {
    mockLogin();
    return mockRoute('/projects/1/forms/f/media-files')
      .beforeEachResponse(app => {
        const loading = app.find(Loading);
        loading.length.should.equal(1);
        loading[0].getProp('state').should.eql(true);
      })
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
      .respondWithData(() =>
        testData.extendedFormAttachments.createPast(1).sorted())
      .afterResponses(app => {
        const loading = app.find(Loading);
        loading.length.should.equal(1);
        loading[0].getProp('state').should.eql(false);
      });
  });

  it('only shows the Submissions tab to a project viewer', () => {
    mockLogin({ role: 'none' });
    const { project, form } = testData.createProjectAndFormWithoutSubmissions({
      project: { role: 'viewer' },
      form: { xmlFormId: 'f' }
    });
    return mockRoute('/projects/1/forms/f/submissions')
      .respondWithData(() => project)
      .respondWithData(() => form)
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .respondWithData(() => testData.standardKeys.sorted())
      .respondWithData(() => form._schema)
      .respondWithData(testData.submissionOData)
      .afterResponses(app => {
        const tabs = app.find('#page-head-tabs a');
        tabs.length.should.equal(1);
        tabs[0].text().should.equal('Submissions');
      });
  });
});
