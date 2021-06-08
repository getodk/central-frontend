import SubmissionUpdateReviewState from '../../../src/components/submission/update-review-state.vue';

import testData from '../../data';
import { mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount, setProps } from '../../util/lifecycle';
import { trigger } from '../../util/event';

const mountOptions = (options = undefined) => ({
  propsData: {
    state: false,
    projectId: '1',
    xmlFormId: testData.extendedForms.last().xmlFormId,
    submission: testData.submissionOData().value[0]
  },
  ...options
});
const mountComponent = (options = undefined) =>
  mount(SubmissionUpdateReviewState, mountOptions(options));
const mockHttpForComponent = (options = undefined) =>
  mockHttp().mount(SubmissionUpdateReviewState, mountOptions(options));

describe('SubmissionUpdateReviewState', () => {
  beforeEach(mockLogin);

  it('renders the correct radio buttons for review state', async () => {
    testData.extendedSubmissions.createPast(1);
    const modal = mountComponent();
    await setProps(modal, { state: true });
    const radios = modal.find('.radio label');
    radios.length.should.equal(3);

    radios[0].first('input').getAttribute('value').should.equal('approved');
    radios[0].find('.icon-check-circle').length.should.equal(1);
    radios[0].text().should.equal('Approved');

    radios[1].first('input').getAttribute('value').should.equal('hasIssues');
    radios[1].find('.icon-comments').length.should.equal(1);
    radios[1].text().should.equal('Has issues');

    radios[2].first('input').getAttribute('value').should.equal('rejected');
    radios[2].find('.icon-times-circle').length.should.equal(1);
    radios[2].text().should.equal('Rejected');
  });

  describe('review state selection', () => {
    it('sets the selection to the current review state', async () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'hasIssues' });
      const modal = mountComponent();
      await setProps(modal, { state: true });
      modal.first('input[value="hasIssues"]').element.checked.should.be.true();
    });

    it('sets selection to approved if current review state is null', async () => {
      testData.extendedSubmissions.createPast(1, { reviewState: null });
      const modal = mountComponent();
      await setProps(modal, { state: true });
      modal.first('input[value="approved"]').element.checked.should.be.true();
    });

    it('sets selection to approved if current review state is edited', async () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'edited' });
      const modal = mountComponent();
      await setProps(modal, { state: true });
      modal.first('input[value="approved"]').element.checked.should.be.true();
    });
  });

  it('focuses the review state radio', async () => {
    testData.extendedSubmissions.createPast(1, { reviewState: 'hasIssues' });
    const modal = mountComponent({ attachToDocument: true });
    await setProps(modal, { state: true });
    modal.first('input[value="hasIssues"]').should.be.focused();
  });

  it('resets the form after the modal is hidden', async () => {
    testData.extendedSubmissions.createPast(1, { reviewState: 'hasIssues' });
    const modal = mountComponent();
    await setProps(modal, { state: true });
    await trigger.check(modal, 'input[value="rejected"]');
    await trigger.input(modal, 'textarea', 'Some notes');
    await setProps(modal, { state: false });
    await setProps(modal, { state: true });
    modal.first('input[value="hasIssues"]').element.checked.should.be.true();
    modal.first('textarea').element.value.should.equal('');
  });

  describe('request', () => {
    it('sends the correct request', () => {
      testData.extendedForms.createPast(1, {
        xmlFormId: 'a b',
        submissions: 1
      });
      testData.extendedSubmissions.createPast(1, {
        instanceId: 'c d',
        reviewState: null
      });
      return mockHttpForComponent()
        .request(async (modal) => {
          await setProps(modal, { state: true });
          return trigger.submit(modal, 'form', [
            ['input[value="hasIssues"]', true]
          ]);
        })
        .beforeEachResponse((_, { method, url, data }) => {
          method.should.equal('PATCH');
          url.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d');
          data.should.eql({ reviewState: 'hasIssues' });
        })
        .respondWithProblem();
    });

    it('sends an X-Action-Notes header if there are notes', () => {
      testData.extendedSubmissions.createPast(1, { reviewState: null });
      return mockHttpForComponent()
        .request(async (modal) => {
          await setProps(modal, { state: true });
          return trigger.submit(modal, 'form', [['textarea', 'Some\nnotes']]);
        })
        .beforeEachResponse((_, { headers }) => {
          headers['X-Action-Notes'].should.equal('Some%0Anotes');
        })
        .respondWithProblem();
    });
  });

  it('implements some standard button things', () => {
    testData.extendedSubmissions.createPast(1, { reviewState: null });
    return mockHttpForComponent()
      .afterResponses(modal => setProps(modal, { state: true }))
      .testStandardButton({
        button: '.btn-primary',
        request: trigger.submit('form'),
        disabled: ['.btn-link'],
        modal: true
      });
  });
});
