import sinon from 'sinon';

import SubmissionDecrypt from '../../../src/components/submission/decrypt.vue';
import SubmissionList from '../../../src/components/submission/list.vue';

import Form from '../../../src/presenters/form';

import testData from '../../data';
import { fillForm, submitForm, trigger } from '../../util/event';
import { mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { wait } from '../../util/util';

const loadSubmissionList = (attachToDocument = false) => {
  // Create test data.
  if (testData.standardKeys.size === 0)
    testData.standardKeys.createPast(1, { managed: true });
  else
    testData.standardKeys.size.should.equal(1);
  const key = testData.standardKeys.last();
  testData.extendedProjects.size.should.equal(0);
  testData.extendedProjects.createPast(1, {
    key: key.managed ? key : null,
    forms: 1
  });
  testData.extendedForms.size.should.equal(0);
  const form = testData.extendedForms.createPast(1).last();

  return mockHttp()
    .mount(SubmissionList, {
      propsData: {
        baseUrl: '/v1/projects/1/forms/f',
        formVersion: new Form(form)
      },
      requestData: { keys: [key] },
      attachToDocument
    })
    .respondWithData(() => form._fields)
    .respondWithData(testData.submissionOData);
};
const submitDecryptForm = (formAction) => {
  const keys = testData.standardKeys.createPast(1, { managed: true }).sorted();
  const modal = mount(SubmissionDecrypt, {
    propsData: { state: true, formAction, delayBetweenChecks: 1 },
    requestData: { keys },
    attachToDocument: true
  });
  // Wait for the iframe to load.
  return wait(200)
    .then(() => submitForm(modal, 'form', [['input', 'passphrase']]));
};

describe('SubmissionDecrypt', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () =>
    loadSubmissionList().testModalToggles({
      modal: SubmissionDecrypt,
      show: '#submission-download-dropdown a',
      hide: '.btn-link'
    }));

  it('receives the form action from SubmissionDownloadDropdown', async () => {
    const component = await loadSubmissionList();
    const modal = component.first(SubmissionDecrypt);
    should.not.exist(modal.getProp('formAction'));
    await trigger.click(component, '#submission-download-dropdown a');
    modal.getProp('formAction').should.equal('/v1/projects/1/forms/f/submissions.csv.zip');
  });

  it('focuses the passphrase input', () =>
    loadSubmissionList(true)
      .afterResponses(component =>
        trigger.click(component, '#submission-download-dropdown a'))
      .then(component => {
        component.first('input').should.be.focused();
      }));

  it('shows a hint if there is one', () => {
    const keys = testData.standardKeys
      .createPast(1, { managed: true, hint: 'some hint' })
      .sorted();
    const modal = mount(SubmissionDecrypt, {
      propsData: {
        state: true,
        formAction: '/v1/projects/1/forms/f/submissions.csv.zip'
      },
      requestData: { keys }
    });
    const introductions = modal.find('.modal-introduction');
    introductions.length.should.equal(2);
    introductions[1].text().trim().should.equal('Hint: some hint');
  });

  it('resets the form after the modal is hidden', async () => {
    const component = await loadSubmissionList();
    await trigger.click(component, '#submission-download-dropdown a');
    const modal = component.first(SubmissionDecrypt);
    await trigger.input(modal, 'input', 'passphrase');
    await trigger.click(modal, '.btn-link');
    await trigger.click(component, '#submission-download-dropdown a');
    modal.first('input').element.value.should.equal('');
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
    const keys = testData.standardKeys
      .createPast(1, { managed: true })
      .sorted();
    const modal = mount(SubmissionDecrypt, {
      propsData: {
        state: true,
        formAction: '/v1/projects/1/forms/f/submissions.csv.zip'
      },
      requestData: { keys },
      attachToDocument: true
    });
    // Wait for the iframe to load.
    return wait(200)
      .then(() => fillForm(modal, [['input', 'secret passphrase']]))
      .then(() => {
        modal.vm.replaceIframeBody();

        const form = modal.vm.$refs.iframe.contentWindow.document
          .querySelector('form');
        form.getAttribute('action').should.equal('/v1/projects/1/forms/f/submissions.csv.zip');

        const inputs = form.querySelectorAll('input');
        inputs.length.should.equal(2);
        inputs[0].getAttribute('name').should.equal(keys[0].id.toString());
        inputs[0].value.should.equal('secret passphrase');
        inputs[1].value.should.equal(modal.vm.session.csrf);
      });
  });

  describe('after the iframe form is submitted', () => {
    it('shows a danger alert if a Problem is returned', () =>
      submitDecryptForm('/test/files/problem.html')
        // Wait for a Problem check.
        .then(modal => wait(200)
          .then(() => {
            modal.should.alert(
              'danger',
              'An unknown internal problem has occurred. Please try again later.'
            );
          })));

    // We do not actually submit the iframe form here, because that would cause
    // the iframe to change pages. Instead, we simply create and fill the form,
    // then call the scheduleProblemCheck() method.
    it('continually checks for a Problem even if form submission is successful', () => {
      const keys = testData.standardKeys
        .createPast(1, { managed: true })
        .sorted();
      const modal = mount(SubmissionDecrypt, {
        propsData: {
          state: true,
          formAction: '/v1/projects/1/forms/f/submissions.csv.zip',
          delayBetweenChecks: 1
        },
        requestData: { keys },
        attachToDocument: true
      });
      // Wait for the iframe to load.
      return wait(200)
        .then(() => {
          modal.vm.replaceIframeBody();
          const spy = sinon.spy(modal.vm, 'checkForProblem');
          modal.vm.scheduleProblemCheck();
          // Wait for a Problem check.
          return wait(200)
            .then(() => {
              spy.called.should.be.true();
              const checks = spy.callCount;
              // Wait for another Problem check.
              return wait(200).then(() => {
                spy.callCount.should.be.above(checks);
                modal.vm.cancelCalls();
              });
            });
        });
    });

    // Here we actually submit the iframe form, which causes the iframe to
    // change pages. To detect the info alert, we return /blank.html instead of
    // a Problem.
    it('shows an info alert', () =>
      submitDecryptForm('/blank.html').then(modal => {
        modal.should.alert('info');
        modal.vm.cancelCalls();
      }));
  });
});
