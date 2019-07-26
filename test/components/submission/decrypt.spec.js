import SubmissionDecrypt from '../../../src/components/submission/decrypt.vue';
import SubmissionList from '../../../src/components/submission/list.vue';
import testData from '../../data';
import { fillForm, submitForm, trigger } from '../../event';
import { mockHttp } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';

const loadSubmissionList = (attachToDocument = false) => {
  // Create test data.
  if (testData.standardKeys.size === 0)
    testData.standardKeys.createPast(1, { managed: true });
  if (testData.extendedProjects.size === 0) {
    const key = testData.standardKeys.sorted().filter(k => k.managed)[0];
    testData.extendedProjects.createPast(1, { key }).last();
  }
  if (testData.extendedForms.size === 0) testData.extendedForms.createPast(1);

  return mockHttp()
    .mount(SubmissionList, {
      propsData: {
        projectId: testData.extendedProjects.last().id.toString(),
        xmlFormId: testData.extendedForms.last().xmlFormId
      },
      requestData: {
        project: testData.extendedProjects.last(),
        form: testData.extendedForms.last()
      },
      attachToDocument
    })
    .request(component => {
      // Normally the `activated` hook calls this method, but that hook is not
      // called here, so we call the method ourselves instead.
      component.vm.fetchInitialData();
    })
    .respondWithData(() => testData.standardKeys.sorted())
    .respondWithData(() => testData.extendedForms.last()._schema)
    .respondWithData(testData.submissionOData);
};
const wait = (delay) => new Promise(resolve => {
  setTimeout(resolve, delay);
});
const submitDecryptForm = (formAction) => {
  const modal = mountAndMark(SubmissionDecrypt, {
    propsData: {
      state: true,
      managedKey: testData.standardKeys.createPast(1, { managed: true }).last(),
      formAction,
      delayBetweenChecks: 1
    },
    attachToDocument: true
  });
  // Wait for the iframe to load.
  return wait(200)
    .then(() => submitForm(modal, 'form', [['input', 'passphrase']]));
};

describe('SubmissionDecrypt', () => {
  beforeEach(mockLogin);

  describe('button tag', () => {
    it('renders the button as a <button> when a managed key is returned', () =>
      loadSubmissionList().afterResponses(component => {
        const button = component.first('#submission-list-download-button');
        button.element.tagName.should.equal('BUTTON');
      }));

    it('renders button as an <a> when only an unmanaged key is returned', () => {
      testData.standardKeys.createPast(1, { managed: false });
      return loadSubmissionList().afterResponses(component => {
        const button = component.first('#submission-list-download-button');
        button.element.tagName.should.equal('A');
      });
    });
  });

  it('shows the modal when the button is clicked', () =>
    loadSubmissionList()
      .afterResponses(component => {
        component.first(SubmissionDecrypt).getProp('state').should.be.false();
        return trigger.click(component, '#submission-list-download-button');
      })
      .then(component => {
        component.first(SubmissionDecrypt).getProp('state').should.be.true();
      }));

  it('focuses the passphrase input', () =>
    loadSubmissionList(true)
      .afterResponses(component =>
        trigger.click(component, '#submission-list-download-button'))
      .then(component => {
        component.first('input').should.be.focused();
      }));

  it('shows a hint if there is one', () => {
    const modal = mountAndMark(SubmissionDecrypt, {
      propsData: {
        state: true,
        managedKey: testData.standardKeys
          .createPast(1, { managed: true, hint: 'some hint' })
          .last(),
        formAction: '/projects/1/forms/f/submissions.csv.zip'
      }
    });
    const introductions = modal.find('.modal-introduction');
    introductions.length.should.equal(2);
    introductions[1].text().trim().should.equal('Hint: some hint');
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
    const modal = mountAndMark(SubmissionDecrypt, {
      propsData: {
        state: true,
        managedKey: key,
        formAction: '/projects/1/forms/f/submissions.csv.zip'
      },
      attachToDocument: true
    });
    // Wait for the iframe to load.
    return wait(200)
      .then(() => fillForm(modal, [['input', 'secret passphrase']]))
      .then(() => {
        modal.vm.replaceIframeBody();

        const form = modal.vm.$refs.iframe.contentWindow.document
          .querySelector('form');
        form.getAttribute('action').should.equal('/projects/1/forms/f/submissions.csv.zip');

        const inputs = form.querySelectorAll('input');
        inputs.length.should.equal(2);
        inputs[0].getAttribute('name').should.equal(key.id.toString());
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
      const key = testData.standardKeys.createPast(1, { managed: true }).last();
      const modal = mountAndMark(SubmissionDecrypt, {
        propsData: {
          state: true,
          managedKey: key,
          formAction: '/projects/1/forms/f/submissions.csv.zip',
          delayBetweenChecks: 1
        },
        attachToDocument: true
      });
      // Wait for the iframe to load.
      return wait(200)
        .then(() => {
          modal.vm.replaceIframeBody();
          modal.setData({ problemChecks: 300 });
          modal.vm.scheduleProblemCheck();
          // Wait for a Problem check.
          return wait(200)
            .then(() => {
              const checks = modal.data().problemChecks;
              checks.should.be.within(2, 299);
              // Wait for another Problem check.
              return wait(200).then(() => {
                modal.data().problemChecks.should.be.within(1, checks - 1);
                clearTimeout(modal.data().timeoutId);
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
        clearTimeout(modal.data().timeoutId);
      }));
  });
});
