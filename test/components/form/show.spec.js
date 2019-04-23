import Loading from '../../../lib/components/loading.vue';
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

  it('shows a link to the project overview', () =>
    mockRoute('/projects/1/forms/f')
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
      .respondWithData(() => testData.extendedFormAttachments.sorted())
      .afterResponses(app => {
        const href = app.first('#page-head-context a').getAttribute('href');
        href.should.equal('#/projects/1');
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
