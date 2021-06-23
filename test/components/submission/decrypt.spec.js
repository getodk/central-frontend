import sinon from 'sinon';

import SubmissionDecrypt from '../../../src/components/submission/decrypt.vue';

import testData from '../../data';
import { loadSubmissionList } from '../../util/submission';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { wait } from '../../util/util';

const createData = () => {
  if (testData.standardKeys.size === 0)
    testData.standardKeys.createPast(1, { managed: true });
  const key = testData.standardKeys.last();
  testData.extendedProjects.createPast(1, {
    key: key.managed ? key : null,
    forms: 1
  });
  testData.extendedForms.createPast(1, {
    fields: [testData.fields.binary('/b')]
  });
};
const mountComponent = (options = {}) => mount(SubmissionDecrypt, {
  ...options,
  propsData: { state: true, ...options.propsData },
  requestData: { keys: testData.standardKeys.sorted() }
});

describe('SubmissionDecrypt', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () => {
    createData();
    return loadSubmissionList().testModalToggles({
      modal: SubmissionDecrypt,
      show: '#submission-download-dropdown a',
      hide: '.btn-link'
    });
  });

  it('receives the form action from SubmissionDownloadDropdown', async () => {
    createData();
    const component = await loadSubmissionList();
    const modal = component.getComponent(SubmissionDecrypt);
    should.not.exist(modal.props().formAction);
    await component.get('#submission-download-dropdown a').trigger('click');
    modal.props().formAction.should.equal('/v1/projects/1/forms/f/submissions.csv.zip');
  });

  it('focuses the passphrase input', async () => {
    createData();
    const component = await loadSubmissionList({ attachTo: document.body });
    await component.get('#submission-download-dropdown a').trigger('click');
    component.getComponent(SubmissionDecrypt).get('input').should.be.focused();
  });

  it('shows a hint if there is one', () => {
    testData.standardKeys.createPast(1, { managed: true, hint: 'some hint' });
    const modal = mountComponent({
      propsData: { formAction: '/v1/projects/1/forms/f/submissions.csv.zip' }
    });
    const introductions = modal.findAll('.modal-introduction');
    introductions.length.should.equal(2);
    introductions.at(1).text().should.equal('Hint: some hint');
  });

  it('resets the form after the modal is hidden', async () => {
    createData();
    const component = await loadSubmissionList();
    await component.get('#submission-download-dropdown a').trigger('click');
    const modal = component.getComponent(SubmissionDecrypt);
    await modal.get('input').setValue('passphrase');
    await modal.get('.btn-link').trigger('click');
    await component.get('#submission-download-dropdown a').trigger('click');
    modal.get('input').element.value.should.equal('');
  });

  /*
  Normally, the iframe form is submitted immediately after it is created, after
  which, at least within our tests, the iframe changes pages. However, that
  means that it is challenging to test things about the iframe form.

  Outside Karma, it seems that the iframe changes pages if a Problem is
  returned after the form submission, but it does not change pages if the
  submission is successful. That means that submitting a form successfully might
  give us a way to test things about the form. However, I'm not sure how to set
  that up in Karma: in these tests, the iframe always changes pages after the
  form is submitted, whether successfully or not.

  Instead, here, we do not submit any form, but simply call the
  replaceIframeBody() method, then test the result.
  */
  it('appends a form to the iframe body and fills it', () => {
    const key = testData.standardKeys.createPast(1, { managed: true }).last();
    const modal = mountComponent({
      propsData: { formAction: '/v1/projects/1/forms/f/submissions.csv.zip' },
      attachTo: document.body
    });
    // Wait for the iframe to load.
    return wait(200)
      .then(() => modal.get('input').setValue('secret passphrase'))
      .then(() => {
        modal.vm.replaceIframeBody();

        const form = modal.vm.$refs.iframe.contentWindow.document
          .querySelector('form');
        form.getAttribute('action').should.equal('/v1/projects/1/forms/f/submissions.csv.zip');

        const inputs = form.querySelectorAll('input');
        inputs.length.should.equal(2);
        inputs[0].getAttribute('name').should.equal(key.id.toString());
        inputs[0].value.should.equal('secret passphrase');
        inputs[1].value.should.equal(modal.vm.session.csrf);
      });
  });

  describe('after the iframe form is submitted', () => {
    beforeEach(() => {
      testData.standardKeys.createPast(1, { managed: true });
    });

    const submit = async (modal) => {
      // Wait for the iframe to load.
      await wait(200);
      await modal.get('input').setValue('passphrase');
      return modal.get('form').trigger('submit');
    };

    it('shows a danger alert if a Problem is returned', async () => {
      const modal = mountComponent({
        propsData: {
          formAction: '/test/files/problem.html',
          delayBetweenChecks: 1
        },
        attachTo: document.body
      });
      await submit(modal);
      // Wait for a Problem check.
      await wait(200);
      modal.should.alert(
        'danger',
        'An unknown internal problem has occurred. Please try again later.'
      );
    });

    // We do not actually submit the iframe form here, because that would cause
    // the iframe to change pages. Instead, we simply create and fill the form,
    // then call the scheduleProblemCheck() method.
    it('continually checks for a Problem even if form submission is successful', async () => {
      const modal = mountComponent({
        propsData: {
          formAction: '/v1/projects/1/forms/f/submissions.csv.zip',
          delayBetweenChecks: 1
        },
        attachTo: document.body
      });
      // Wait for the iframe to load.
      await wait(200);
      modal.vm.replaceIframeBody();
      const spy = sinon.spy(modal.vm, 'checkForProblem');
      modal.vm.scheduleProblemCheck();
      // Wait for a Problem check.
      await wait(200);
      spy.called.should.be.true();
      const checks = spy.callCount;
      // Wait for another Problem check.
      await wait(200);
      spy.callCount.should.be.above(checks);
    });

    // Here we actually submit the iframe form, which causes the iframe to
    // change pages. To detect the info alert, we return /blank.html instead of
    // a Problem.
    it('shows an info alert', async () => {
      const modal = mountComponent({
        propsData: { formAction: '/blank.html' },
        attachTo: document.body
      });
      await submit(modal);
      modal.should.alert('info');
    });
  });
});
