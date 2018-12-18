import Form from '../../../lib/presenters/form';
import FormDelete from '../../../lib/components/form/delete.vue';
import FormSettings from '../../../lib/components/form/settings.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';
import { trigger } from '../../util';

const clickDeleteButton = (wrapper) =>
  trigger.click(wrapper.first('#form-settings .panel-simple-danger .btn-danger'))
    .then(() => wrapper);
const confirmDelete = (wrapper) =>
  trigger.click(wrapper.first('#form-delete .btn-danger'))
    .then(() => wrapper);

describe('FormDelete', () => {
  beforeEach(mockLogin);

  it('opens the modal upon button click', () => {
    const form = new Form(testData.extendedForms.createPast(1).last());
    const propsData = { form };
    const page = mountAndMark(FormSettings, { propsData });
    page.first(FormDelete).getProp('state').should.be.false();
    return clickDeleteButton(page)
      .then(() => page.first(FormDelete).getProp('state').should.be.true());
  });

  it('standard button thinking things', () => {
    const form = new Form(testData.extendedForms.createPast(1).last());
    const propsData = { form };
    return mockHttp()
      .mount(FormDelete, { propsData })
      .request(confirmDelete)
      .standardButton('.btn-danger');
  });

  describe('after successful response', () => {
    let app;
    beforeEach(() => {
      testData.extendedForms.createPast(2);
      const { xmlFormId } = testData.extendedForms.first();
      return mockRoute(`/forms/${xmlFormId}/settings`)
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

    it('redirects user to form list', () => {
      app.vm.$route.path.should.equal('/forms');
    });

    it('shows a success message', () => {
      app.should.alert('success');
    });
  });
});
