import FormDelete from '../../../src/components/form/delete.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountOptions = () => ({
  props: { state: true },
  container: {
    requestData: { form: testData.extendedForms.last() }
  }
});

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

  describe('introductory text', () => {
    it('shows the correct text if the form creates entities', () => {
      testData.extendedForms.createPast(1, { entityRelated: true });
      const modal = mount(FormDelete, mountOptions());
      const p = modal.findAll('.modal-introduction p');
      p.length.should.equal(3);
      p[2].text().should.containEql('Entities');
    });

    it('shows the correct text if the form does not create entities', () => {
      testData.extendedForms.createPast(1, { entityRelated: false });
      const modal = mount(FormDelete, mountOptions());
      modal.findAll('.modal-introduction p').length.should.equal(2);
    });
  });

  it('implements some standard button things', () => {
    testData.extendedForms.createPast(1);
    return mockHttp()
      .mount(FormDelete, mountOptions())
      .testStandardButton({
        button: '.btn-danger',
        disabled: ['.btn-link'],
        modal: true
      });
  });

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
