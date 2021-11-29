import FormDelete from '../../../src/components/form/delete.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('FormDelete', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () => {
    testData.extendedForms.createPast(1);
    return load('/projects/1/forms/f/settings', { root: false })
      .testModalToggles({
        modal: FormDelete,
        show: '#form-settings .panel-simple-danger .btn-danger',
        hide: '.btn-link'
      });
  });

  it('implements some standard button things', () =>
    mockHttp()
      .mount(FormDelete, {
        propsData: { state: true },
        requestData: { form: testData.extendedForms.createPast(1).last() }
      })
      .testStandardButton({
        button: '.btn-danger',
        disabled: ['.btn-link'],
        modal: true
      }));

  describe('after a successful response', () => {
    const del = () => {
      testData.extendedForms.createPast(1);
      return load('/projects/1/forms/f/settings')
        .complete()
        .request(async (app) => {
          await app.get('#form-settings .panel-simple-danger .btn-danger').trigger('click');
          return app.get('#form-delete .btn-danger').trigger('click');
        })
        .respondWithData(() => {
          testData.extendedForms.splice(0, 1);
          return { success: true };
        })
        .respondWithData(() => testData.extendedForms.sorted())
        .respondWithData(() => []); // Empty list of deleted forms
    };

    it('navigates to the project overview', async () => {
      const app = await del();
      app.vm.$route.path.should.equal('/projects/1');
    });

    it('shows a success message', async () => {
      const app = await del();
      app.should.alert('success');
    });
  });
});
