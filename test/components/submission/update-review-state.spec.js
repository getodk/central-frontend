import SubmissionUpdateReviewState from '../../../src/components/submission/update-review-state.vue';
import MarkdownTextarea from '../../../src/components/markdown/textarea.vue';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';

const mountOptions = (options = undefined) => mergeMountOptions(options, {
  props: {
    state: false,
    projectId: '1',
    xmlFormId: testData.extendedForms.last().xmlFormId,
    submission: testData.submissionOData().value[0]
  }
});

describe('SubmissionUpdateReviewState', () => {
  beforeEach(mockLogin);

  it('renders the correct radio buttons for review state', async () => {
    testData.extendedSubmissions.createPast(1);
    const modal = mount(SubmissionUpdateReviewState, mountOptions());
    await modal.setProps({ state: true });
    const radios = modal.findAll('.radio label');
    radios.length.should.equal(3);

    radios[0].get('input').attributes().value.should.equal('approved');
    radios[0].find('.icon-check-circle').exists().should.be.true();
    radios[0].text().should.equal('Approved');

    radios[1].get('input').attributes().value.should.equal('hasIssues');
    radios[1].find('.icon-comments').exists().should.be.true();
    radios[1].text().should.equal('Has issues');

    radios[2].get('input').attributes().value.should.equal('rejected');
    radios[2].find('.icon-times-circle').exists().should.be.true();
    radios[2].text().should.equal('Rejected');
  });

  describe('review state selection', () => {
    it('sets the selection to the current review state', async () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'hasIssues' });
      const modal = mount(SubmissionUpdateReviewState, mountOptions());
      await modal.setProps({ state: true });
      modal.get('input[value="hasIssues"]').element.checked.should.be.true();
    });

    it('sets selection to approved if current review state is null', async () => {
      testData.extendedSubmissions.createPast(1, { reviewState: null });
      const modal = mount(SubmissionUpdateReviewState, mountOptions());
      await modal.setProps({ state: true });
      modal.get('input[value="approved"]').element.checked.should.be.true();
    });

    it('sets selection to approved if current review state is edited', async () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'edited' });
      const modal = mount(SubmissionUpdateReviewState, mountOptions());
      await modal.setProps({ state: true });
      modal.get('input[value="approved"]').element.checked.should.be.true();
    });
  });

  it('focuses the review state radio', async () => {
    testData.extendedSubmissions.createPast(1, { reviewState: 'hasIssues' });
    const modal = mount(SubmissionUpdateReviewState, mountOptions({
      attachTo: document.body
    }));
    await modal.setProps({ state: true });
    await modal.vm.$nextTick();
    modal.get('input[value="hasIssues"]').should.be.focused();
  });

  it('does not require a comment in the text area', async () => {
    testData.extendedSubmissions.createPast(1, { reviewState: 'hasIssues' });
    const modal = mount(SubmissionUpdateReviewState, mountOptions());
    await modal.setProps({ state: true });
    modal.getComponent(MarkdownTextarea).props().required.should.equal(false);
  });

  it('resets the form after the modal is hidden', async () => {
    testData.extendedSubmissions.createPast(1, { reviewState: 'hasIssues' });
    const modal = mount(SubmissionUpdateReviewState, mountOptions());
    await modal.setProps({ state: true });
    await modal.get('input[value="rejected"]').setChecked();
    await modal.setData({ notes: 'Some notes' });
    await modal.setProps({ state: false });
    await modal.setProps({ state: true });
    modal.get('input[value="hasIssues"]').element.checked.should.be.true();
    modal.getComponent(MarkdownTextarea).props().modelValue.should.equal('');
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
      return mockHttp()
        .mount(SubmissionUpdateReviewState, mountOptions())
        .request(async (modal) => {
          await modal.setProps({ state: true });
          await modal.get('input[value="hasIssues"]').setChecked();
          return modal.get('form').trigger('submit');
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
      return mockHttp()
        .mount(SubmissionUpdateReviewState, mountOptions())
        .request(async (modal) => {
          await modal.setProps({ state: true });
          await modal.setData({ notes: 'Some\nnotes' });
          modal.get('form').trigger('submit');
        })
        .beforeEachResponse((_, { headers }) => {
          headers['X-Action-Notes'].should.equal('Some%0Anotes');
        })
        .respondWithProblem();
    });
  });

  it('implements some standard button things', () => {
    testData.extendedSubmissions.createPast(1, { reviewState: null });
    return mockHttp()
      .mount(SubmissionUpdateReviewState, mountOptions())
      .afterResponses(modal => modal.setProps({ state: true }))
      .testStandardButton({
        button: '.btn-primary',
        request: (modal) => modal.get('form').trigger('submit'),
        disabled: ['.btn-link'],
        modal: true
      });
  });

  describe('markdown preview comment box', () => {
    it('shows the markdown footer during the request', async () => {
      testData.extendedSubmissions.createPast(1, { reviewState: 'hasIssues' });
      return mockHttp()
        .mount(SubmissionUpdateReviewState, mountOptions())
        .request(async (modal) => {
          await modal.setProps({ state: true });
          await modal.setData({ notes: 'some notes' });
          modal.get('form').trigger('submit');
        })
        .beforeAnyResponse(async (modal) => {
          await modal.setData({ notes: '' }); // Linked to child's 'value' prop and textarea
          modal.getComponent(MarkdownTextarea).props().showFooter.should.be.true();
        })
        .respondWithProblem();
    });
  });
});
