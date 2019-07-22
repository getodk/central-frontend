import SubmissionDecrypt from '../../../src/components/submission/decrypt.vue';
import SubmissionList from '../../../src/components/submission/list.vue';
import testData from '../../data';
import { mockHttp } from '../../http';
import { mockLogin } from '../../session';
import { mountAndMark } from '../../destroy';
import { submitForm, trigger } from '../../event';

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
  return submitForm(modal, 'form', [['input', 'passphrase']]);
};
const wait = (delay) => new Promise(resolve => {
  setTimeout(resolve, delay);
});

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

  // Normally, the iframe form is submitted immediately after it is created,
  // after which the iframe may change pages. However, that means that it is
  // challenging to test things about the iframe form. Here, we do not submit
  // any form, but simply call the replaceIframeBody() method, then test the
  // result.
  it('appends a form to the iframe with an input whose name equals key id', () => {
    const key = testData.standardKeys.createPast(1, { managed: true }).last();
    const modal = mountAndMark(SubmissionDecrypt, {
      propsData: {
        state: true,
        managedKey: key,
        formAction: '/projects/1/forms/f/submissions.csv.zip'
      },
      attachToDocument: true
    });
    modal.vm.replaceIframeBody();
    const { iframe } = modal.vm.$refs;
    const input = iframe.contentWindow.document.querySelector('input');
    input.getAttribute('name').should.equal(key.id.toString());
  });

  describe('after the iframe form is submitted', () => {
    it('shows a danger alert if a Problem is returned', () =>
      submitDecryptForm('/test/files/problem.html')
        .then(modal => wait(200)
          .then(() => {
            modal.should.alert(
              'danger',
              'An unknown internal problem has occurred. Please try again later.'
            );
          })));

    it('continually checks for a Problem even if a non-Problem is returned', () =>
      submitDecryptForm('/blank.html')
        .then(modal => wait(200)
          .then(() => {
            const checks = modal.data().problemChecks;
            checks.should.be.within(2, 299);
            return wait(200).then(() => {
              modal.data().problemChecks.should.be.within(1, checks - 1);
              clearTimeout(modal.data().timeoutId);
            });
          })));

    it('shows an info alert', () =>
      submitDecryptForm('/blank.html').then(modal => {
        modal.should.alert('info');
        clearTimeout(modal.data().timeoutId);
      }));
  });
});
