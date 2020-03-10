import Loading from '../../../src/components/loading.vue';
import NotFound from '../../../src/components/not-found.vue';
import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRoute } from '../../util/http';

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
});
