import FormDraftAbandon from '../../../src/components/form-draft/abandon.vue';

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

describe('FormDraftAbandon', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () => {
    testData.extendedForms.createPast(1, { draft: true });
    return load('/projects/1/forms/f/draft', { root: false }).testModalToggles({
      modal: FormDraftAbandon,
      show: '#form-edit-abandon-button',
      hide: '.btn-link'
    });
  });

  it('shows the correct text for a form with a published version', () => {
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { draft: true });
    const modal = mount(FormDraftAbandon, mountOptions());
    modal.get('.modal-title').text().should.equal('Abandon Draft');
    const p = modal.findAll('.modal-introduction p');
    p.length.should.equal(3);
    p[0].text().should.endWith('all test Submissions will be removed.');
    modal.get('.btn-danger').text().should.equal('Abandon');
  });

  it('shows the correct text for a form without a published version', () => {
    testData.extendedForms.createPast(1, { draft: true });
    const modal = mount(FormDraftAbandon, mountOptions());
    modal.get('.modal-title').text().should.equal('Delete Form');
    const p = modal.findAll('.modal-introduction p');
    p.length.should.equal(2);
    p[0].text().should.endWith('this entire Form will be deleted and moved to the Trash.');
    modal.get('.btn-danger').text().should.equal('Delete');
  });

  describe('request', () => {
    it('sends the correct request for a form with a published version', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      return mockHttp()
        .mount(FormDraftAbandon, mountOptions())
        .request(modal => modal.get('.btn-danger').trigger('click'))
        .beforeEachResponse((_, { method, url }) => {
          method.should.equal('DELETE');
          url.should.equal('/v1/projects/1/forms/f/draft');
        })
        .respondWithProblem();
    });

    it('sends correct request for a form without a published version', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return mockHttp()
        .mount(FormDraftAbandon, mountOptions())
        .request(modal => modal.get('.btn-danger').trigger('click'))
        .beforeEachResponse((_, { method, url }) => {
          method.should.equal('DELETE');
          url.should.equal('/v1/projects/1/forms/f');
        })
        .respondWithProblem();
    });
  });

  it('implements some standard button things', () => {
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { draft: true });
    return mockHttp()
      .mount(FormDraftAbandon, mountOptions())
      .testStandardButton({
        button: '.btn-danger',
        disabled: ['.btn-link'],
        modal: true
      });
  });

  describe('after abandoning draft for a form with a published version', () => {
    const abandon = () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(async (app) => {
          await app.get('#form-edit-abandon-button').trigger('click');
          return app.get('#form-draft-abandon .btn-danger').trigger('click');
        })
        .respondWithSuccess();
    };

    it('hides the modal', async () => {
      const app = await abandon();
      app.getComponent(FormDraftAbandon).props().state.should.be.false;
    });

    it('shows a success alert', async () => {
      const app = await abandon();
      app.should.alert('success', 'The Draft version of this Form has been successfully deleted.');
    });

    it('shows the create draft button', async () => {
      const app = await abandon();
      app.get('#form-edit-create-draft-button').should.be.visible();
    });
  });

  describe('after abandoning draft for a form without a published version', () => {
    const abandon = () => {
      testData.extendedForms.createPast(1, { name: 'My Form', draft: true });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(async (app) => {
          await app.get('#form-edit-abandon-button').trigger('click');
          return app.get('#form-draft-abandon .btn-danger').trigger('click');
        })
        .respondWithSuccess()
        .respondWithData(() => []) // forms
        .respondWithData(() => []); // deletedForms
    };

    it('shows a success alert', () =>
      abandon().then(app => {
        app.should.alert('success', 'The Form “My Form” has been successfully deleted.');
      }));

    it('redirects to the forms page', () =>
      abandon().then(app => {
        app.vm.$route.path.should.equal('/projects/1');
      }));

    it('decreases the form count even before the forms response', () =>
      abandon().beforeEachResponse((app, _, i) => {
        if (i === 0) return;
        app.get('#page-head-tabs li.active .badge').text().should.equal('0');
      }));
  });
});
