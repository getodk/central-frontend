import FormDelete from '../../../src/components/form/delete.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

describe('FormDelete', () => {
  beforeEach(mockLogin);

  it('shows the modal after the button is clicked', () =>
    mockRoute('/projects/1/forms/f/settings')
      .respondWithData(() => testData.extendedProjects.createPast(1).last())
      .respondWithData(() =>
        testData.extendedForms.createPast(1, { xmlFormId: 'f' }).last())
      .respondWithProblem(404.1) // formDraft
      .respondWithProblem(404.1) // attachments
      .afterResponses(app => {
        app.first(FormDelete).getProp('state').should.be.false();
        return trigger.click(app, '#form-settings .panel-simple-danger .btn-danger');
      })
      .then(app => {
        app.first(FormDelete).getProp('state').should.be.true();
      }));

  it('implements some standard button things', () =>
    mockHttp()
      .mount(FormDelete, {
        requestData: { form: testData.extendedForms.createPast(1).last() }
      })
      .request(modal => trigger.click(modal, '#form-delete .btn-danger'))
      .standardButton('.btn-danger'));

  describe('after a successful response', () => {
    let app;
    beforeEach(() => {
      testData.extendedProjects.createPast(1);
      testData.extendedForms.createPast(2);
      const { xmlFormId } = testData.extendedForms.first();
      return mockRoute(`/projects/1/forms/${encodeURIComponent(xmlFormId)}/settings`)
        .respondWithData(() => testData.extendedProjects.last())
        .respondWithData(() => testData.extendedForms.first())
        .respondWithProblem(404.1) // formDraft
        .respondWithProblem(404.1) // attachments
        .afterResponses(component => {
          app = component;
          return trigger.click(app, '#form-settings .panel-simple-danger .btn-danger');
        })
        .request(() => {
          testData.extendedForms.splice(0, 1);
          return trigger.click(app, '#form-delete .btn-danger');
        })
        .respondWithSuccess()
        .respondWithData(() => testData.extendedForms.sorted());
    });

    it('navigates to the project overview', () => {
      app.vm.$route.path.should.equal('/projects/1');
    });

    it('shows a success message', () => {
      app.should.alert('success');
    });
  });
});
