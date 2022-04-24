import FormDraftAbandon from '../../../src/components/form-draft/abandon.vue';
import FormRow from '../../../src/components/form/row.vue';

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
      show: '#form-draft-status-abandon-button',
      hide: '.btn-link'
    });
  });

  describe('modal title', () => {
    it('shows the correct title for a form with a published version', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      const modal = mount(FormDraftAbandon, mountOptions());
      modal.get('.modal-title').text().should.equal('Abandon Draft');
    });

    it('shows the correct title for a form without a published version', () => {
      testData.extendedForms.createPast(1, { draft: true });
      const modal = mount(FormDraftAbandon, mountOptions());
      modal.get('.modal-title').text().should.equal('Abandon Draft and Delete Form');
    });
  });

  describe('explanatory text', () => {
    describe('form with a published version', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1);
        testData.extendedFormVersions.createPast(1, { draft: true });
      });

      it('shows the correct text for the first paragraph', () => {
        const modal = mount(FormDraftAbandon, mountOptions());
        const text = modal.get('.modal-introduction p').text();
        text.should.endWith('all test Submissions will be removed.');
      });

      it('renders an additional paragraph', () => {
        const modal = mount(FormDraftAbandon, mountOptions());
        modal.findAll('.modal-introduction p').length.should.equal(3);
      });
    });

    describe('form without a published version', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1, { draft: true });
      });

      it('shows the correct text for the first paragraph', () => {
        const modal = mount(FormDraftAbandon, mountOptions());
        const text = modal.get('.modal-introduction p').text();
        text.should.endWith('this entire Form will be deleted and moved to the Trash.');
      });

      it('does not render an additional paragraph', () => {
        const modal = mount(FormDraftAbandon, mountOptions());
        modal.findAll('.modal-introduction p').length.should.equal(2);
      });
    });
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
          await app.get('#form-draft-status-abandon-button').trigger('click');
          return app.get('#form-draft-abandon .btn-danger').trigger('click');
        })
        .respondWithSuccess();
    };

    it('shows a success alert', () =>
      abandon().then(app => {
        app.should.alert('success', 'The Draft version of this Form has been successfully deleted.');
      }));

    it('redirects to the form overview', () =>
      abandon().then(app => {
        app.vm.$route.path.should.equal('/projects/1/forms/f');
      }));

    it('shows the create draft button', () =>
      abandon().then(app => {
        app.get('#form-head-create-draft-button').should.be.visible();
      }));
  });

  describe('after abandoning draft for a form without a published version', () => {
    const abandon = () => {
      testData.extendedForms.createPast(1, { name: 'My Form', draft: true });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(async (app) => {
          await app.get('#form-draft-status-abandon-button').trigger('click');
          return app.get('#form-draft-abandon .btn-danger').trigger('click');
        })
        .respondWithSuccess()
        .respondWithData(() => []) // forms
        .respondWithData(() => []); // deleted forms
    };

    it('shows a success alert', () =>
      abandon().then(app => {
        app.should.alert('success', 'The Form “My Form” was deleted.');
      }));

    it('redirects to the project overview', () =>
      abandon().then(app => {
        app.vm.$route.path.should.equal('/projects/1');
      }));

    it('does not show the form in the table', () =>
      abandon().then(app => {
        app.findComponent(FormRow).exists().should.be.false();
      }));
  });
});
