import FormDelete from '../../../src/components/form/delete.vue';
import FormSettings from '../../../src/components/form/settings.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';
import { trigger } from '../../event';

const clickDeleteButton = (wrapper) =>
  trigger.click(wrapper.first('#form-settings .panel-simple-danger .btn-danger'))
    .then(() => wrapper);
const confirmDelete = (wrapper) =>
  trigger.click(wrapper.first('#form-delete .btn-danger'))
    .then(() => wrapper);

describe('FormDelete', () => {
  beforeEach(mockLogin);

  it('opens the modal upon button click', () => {
    const page = mountAndMark(FormSettings, {
      propsData: { projectId: '1' },
      requestData: { form: testData.extendedForms.createPast(1).last() }
    });
    page.first(FormDelete).getProp('state').should.be.false();
    return clickDeleteButton(page)
      .then(() => page.first(FormDelete).getProp('state').should.be.true());
  });

  it('standard button thinking things', () =>
    mockHttp()
      .mount(FormDelete, {
        propsData: { projectId: '1' },
        requestData: { form: testData.extendedForms.createPast(1).last() }
      })
      .request(confirmDelete)
      .standardButton('.btn-danger'));

  describe('after successful response', () => {
    let app;
    beforeEach(() => {
      testData.extendedProjects.createPast(1);
      testData.extendedForms.createPast(2);
      const { xmlFormId } = testData.extendedForms.first();
      return mockRoute(`/projects/1/forms/${encodeURIComponent(xmlFormId)}/settings`)
        .respondWithData(() => testData.extendedProjects.last())
        .respondWithData(() => testData.extendedForms.first())
        .respondWithData(() => testData.extendedFormAttachments.sorted())
        .afterResponses(component => {
          app = component;
          return clickDeleteButton(app);
        })
        .request(() => {
          testData.extendedForms.splice(0, 1);
          return confirmDelete(app);
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
