import SubmissionComment from '../../../src/components/submission/comment.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { trigger } from '../../util/event';

const mountOptions = (propsData) => ({
  propsData: {
    projectId: '1',
    xmlFormId: testData.extendedForms.last().xmlFormId,
    instanceId: testData.extendedSubmissions.last().instanceId,
    feed: null,
    ...propsData
  }
});
const mountComponent = (propsData = undefined) =>
  mount(SubmissionComment, mountOptions(propsData));
const mockHttpForComponent = (propsData = undefined) =>
  mockHttp().mount(SubmissionComment, mountOptions(propsData));

describe('SubmissionComment', () => {
  beforeEach(mockLogin);

  describe('alert', () => {
    beforeEach(() => {
      testData.extendedSubmissions.createNew();
    });

    it('does not show the alert if the feed is loading', () => {
      const component = mountComponent({ feed: null });
      component.find('[role="alert"]').length.should.equal(0);
    });

    it('does not show the alert if the user did not make an edit', () => {
      const user = testData.extendedUsers.createPast(1).last();
      const component = mountComponent({
        feed: [
          testData.extendedAudits.createNew({ action: 'submission.create' }),
          testData.extendedAudits.createNew({
            actor: user,
            action: 'submission.update.version'
          })
        ].reverse()
      });
      component.find('[role="alert"]').length.should.equal(0);
    });

    it('does not show the alert if the user commented after their edit', () => {
      const component = mountComponent({
        feed: [
          testData.extendedAudits.createNew({ action: 'submission.create' }),
          testData.extendedAudits.createNew({
            action: 'submission.update.version'
          }),
          testData.extendedComments.createNew()
        ].reverse()
      });
      component.find('[role="alert"]').length.should.equal(0);
    });

    it('shows the alert if the user did not comment', () => {
      const component = mountComponent({
        feed: [
          testData.extendedAudits.createNew({ action: 'submission.create' }),
          testData.extendedAudits.createNew({
            action: 'submission.update.version'
          })
        ].reverse()
      });
      component.find('[role="alert"]').length.should.equal(1);
    });

    it('shows the alert if the user commented before their edit', () => {
      const component = mountComponent({
        feed: [
          testData.extendedAudits.createNew({ action: 'submission.create' }),
          testData.extendedComments.createNew(),
          testData.extendedAudits.createNew({
            action: 'submission.update.version'
          })
        ].reverse()
      });
      component.find('[role="alert"]').length.should.equal(1);
    });

    it('shows the alert if another user commented', () => {
      const user = testData.extendedUsers.createPast(1).last();
      const component = mountComponent({
        feed: [
          testData.extendedAudits.createNew({ action: 'submission.create' }),
          testData.extendedAudits.createNew({
            action: 'submission.update.version'
          }),
          testData.extendedComments.createNew({ actor: user })
        ].reverse()
      });
      component.find('[role="alert"]').length.should.equal(1);
    });
  });

  describe('visibility of actions', () => {
    it('shows the actions if there is input', async () => {
      testData.extendedSubmissions.createPast(1);
      const component = mountComponent();
      const actions = component.first('#submission-comment-actions');
      actions.should.be.hidden();
      const textarea = component.first('textarea');
      await trigger.input(textarea, 'foo');
      actions.should.be.visible();
      await trigger.input(textarea, '');
      actions.should.be.hidden();
    });

    it('shows the actions during the request', () => {
      testData.extendedSubmissions.createPast(1);
      return mockHttpForComponent()
        .request(trigger.submit('form', [['textarea', 'foo']]))
        .beforeAnyResponse(async (component) => {
          await trigger.input(component, 'textarea', '');
          component.first('#submission-comment-actions').should.be.visible();
        })
        .respondWithProblem();
    });

    it('shows the actions if the user did not comment after editing', () => {
      testData.extendedSubmissions.createNew();
      const component = mountComponent({
        feed: [
          testData.extendedAudits.createNew({ action: 'submission.create' }),
          testData.extendedAudits.createNew({
            action: 'submission.update.version'
          })
        ].reverse()
      });
      component.first('#submission-comment-actions').should.be.visible();
    });
  });

  it('sends the correct request', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
    testData.extendedSubmissions.createPast(1, { instanceId: 'c d' });
    return mockHttpForComponent()
      .request(trigger.submit('form', [['textarea', 'foo']]))
      .beforeEachResponse((_, { method, url, data }) => {
        method.should.equal('POST');
        url.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/comments');
        data.should.eql({ body: 'foo' });
      })
      .respondWithProblem();
  });

  it('implements some standard button things', () => {
    testData.extendedSubmissions.createPast(1);
    return mockHttpForComponent().testStandardButton({
      button: 'button[type="submit"]',
      request: trigger.submit('form', [['textarea', 'foo']])
    });
  });

  describe('after a successful response', () => {
    const submit = () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
      testData.extendedSubmissions.createPast(1, { instanceId: 'c d' });
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      return load('/projects/1/forms/a%20b/submissions/c%20d', { root: false })
        .complete()
        .request(trigger.submit('#submission-comment', [['textarea', 'foo']]))
        .respondWithData(() =>
          testData.standardComments.createNew({ body: 'foo' }))
        .respondWithData(() => testData.extendedAudits.sorted())
        .respondWithData(() => testData.extendedComments.sorted());
    };

    it('sends the correct requests for activity data', () =>
      submit().beforeEachResponse((_, { method, url, headers }, index) => {
        if (index === 0) return;
        method.should.equal('GET');
        if (index === 1) {
          url.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/audits');
          headers['X-Extended-Metadata'].should.equal('true');
        } else {
          url.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/comments');
          headers['X-Extended-Metadata'].should.equal('true');
        }
      }));

    it('resets the field', async () => {
      const component = await submit();
      const { value } = component.first('#submission-comment textarea').element;
      value.should.equal('');
    });

    it('updates the number of entries in the feed');
  });
});
