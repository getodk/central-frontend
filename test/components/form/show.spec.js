import Loading from '../../../src/components/loading.vue';
import testData from '../../data';
import { mockLogin } from '../../session';
import { mockRoute } from '../../http';

describe('FormShow', () => {
  beforeEach(mockLogin);

  it("shows the project's name", () =>
    mockRoute('/projects/1/forms/f')
      .respondWithData(() =>
        testData.extendedProjects.createPast(1, { name: 'My Project' }).last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .afterResponses(app => {
        const text = app.first('#page-head-context span').text().trim();
        text.should.equal('My Project');
      }));

  it("appends (archived) to an archived project's name", () =>
    mockRoute('/projects/1/forms/f')
      .respondWithData(() => testData.extendedProjects
        .createPast(1, { name: 'My Project', archived: true })
        .last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .afterResponses(app => {
        const text = app.first('#page-head-context span').text().trim();
        text.should.equal('My Project (archived)');
      }));

  it("renders the project's name as a link", () =>
    mockRoute('/projects/1/forms/f')
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .afterResponses(app => {
        const a = app.first('#page-head-context span a');
        a.getAttribute('href').should.equal('#/projects/1');
      }));

  it('shows a link back to the project overview', () =>
    mockRoute('/projects/1/forms/f')
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .afterResponses(app => {
        const a = app.find('#page-head-context a');
        a.length.should.equal(2);
        a[1].getAttribute('href').should.equal('#/projects/1');
      }));

  it("shows the form's name", () =>
    mockRoute('/projects/1/forms/f')
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .afterResponses(app => {
        const title = app.first('#page-head-title').text().trim();
        const form = testData.extendedForms.last();
        title.should.equal(form.name != null ? form.name : form.xmlFormId);
      }));

  it('shows a loading message until all responses are returned', () =>
    mockRoute('/projects/1/forms/x/media-files')
      .beforeEachResponse(app => {
        const loading = app.find(Loading);
        loading.length.should.equal(1);
        loading[0].getProp('state').should.eql(true);
      })
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'x' }).last())
      .respondWithData(() =>
        testData.extendedFormAttachments.createPast(1).sorted())
      .afterResponses(app => {
        const loading = app.find(Loading);
        loading.length.should.equal(1);
        loading[0].getProp('state').should.eql(false);
      }));
});
