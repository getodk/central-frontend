import FormDraftAbandon from '../../../src/components/form-draft/abandon.vue';
import FormRow from '../../../src/components/form/row.vue';
import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { trigger } from '../../util/event';

const mountComponent = () => mount(FormDraftAbandon, {
  propsData: { state: true },
  requestData: { form: testData.extendedForms.last() }
});
const mockHttpForComponent = () => mockHttp().mount(FormDraftAbandon, {
  propsData: { state: true },
  requestData: { form: testData.extendedForms.last() }
});

describe('FormDraftAbandon', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () => {
    testData.extendedForms.createPast(1, { draft: true });
    return load('/projects/1/forms/f/draft').testModalToggles(
      FormDraftAbandon,
      '#form-draft-status-abandon-button',
      '.btn-link'
    );
  });

  describe('modal title', () => {
    it('shows the correct title for a form with a published version', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      const text = mountComponent().first('.modal-title').text().trim();
      text.should.equal('Abandon Draft');
    });

    it('shows the correct title for a form without a published version', () => {
      testData.extendedForms.createPast(1, { draft: true });
      const text = mountComponent().first('.modal-title').text().trim();
      text.should.equal('Abandon Draft and Delete Form');
    });
  });

  describe('explanatory text', () => {
    describe('form with a published version', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1);
        testData.extendedFormVersions.createPast(1, { draft: true });
      });

      it('shows the correct text for the first paragraph', () => {
        const p = mountComponent().first('.modal-introduction p');
        const text = p.text().trim().iTrim();
        text.should.endWith('all test Submissions will be removed.');
      });

      it('renders an additional paragraph', () => {
        mountComponent().find('.modal-introduction p').length.should.equal(3);
      });
    });

    describe('form without a published version', () => {
      beforeEach(() => {
        testData.extendedForms.createPast(1, { draft: true });
      });

      it('shows the correct text for the first paragraph', () => {
        const p = mountComponent().first('.modal-introduction p');
        const text = p.text().trim().iTrim();
        text.should.endWith('this Form will be entirely deleted.');
      });

      it('does not render an additional paragraph', () => {
        mountComponent().find('.modal-introduction p').length.should.equal(2);
      });
    });
  });

  describe('request', () => {
    it('sends the correct request for a form with a published version', () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      return mockHttpForComponent()
        .request(trigger.click('.btn-danger'))
        .beforeEachResponse((modal, { method, url }) => {
          method.should.equal('DELETE');
          url.should.equal('/v1/projects/1/forms/f/draft');
        })
        .respondWithProblem();
    });

    it('sends correct request for a form without a published version', () => {
      testData.extendedForms.createPast(1, { draft: true });
      return mockHttpForComponent()
        .request(trigger.click('.btn-danger'))
        .beforeEachResponse((modal, { method, url }) => {
          method.should.equal('DELETE');
          url.should.equal('/v1/projects/1/forms/f');
        })
        .respondWithProblem();
    });
  });

  it('implements some standard button things', () => {
    testData.extendedForms.createPast(1);
    testData.extendedFormVersions.createPast(1, { draft: true });
    return mockHttpForComponent().testStandardButton({
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
        .request(app => trigger.click(app, '#form-draft-status-abandon-button')
          .then(trigger.click('#form-draft-abandon .btn-danger')))
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
        app.first('#form-head-create-draft-button').should.be.visible();
      }));
  });

  describe('after abandoning draft for a form without a published version', () => {
    const abandon = () => {
      testData.extendedForms.createPast(1, { name: 'My Form', draft: true });
      return load('/projects/1/forms/f/draft')
        .complete()
        .request(app => trigger.click(app, '#form-draft-status-abandon-button')
          .then(trigger.click('#form-draft-abandon .btn-danger')))
        .respondWithSuccess()
        .respondWithData(() => []); // forms
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
        app.find(FormRow).length.should.equal(0);
      }));
  });
});
