import SubmissionComment from '../../../src/components/submission/comment.vue';
import MarkdownTextarea from '../../../src/components/markdown/textarea.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountOptions = (props = undefined) => ({
  props: {
    projectId: '1',
    xmlFormId: testData.extendedForms.last().xmlFormId,
    instanceId: testData.extendedSubmissions.last().instanceId,
    feed: null,
    ...props
  }
});

describe('SubmissionComment', () => {
  beforeEach(mockLogin);

  describe('alert', () => {
    beforeEach(() => {
      testData.extendedSubmissions.createNew();
    });

    it('does not show the alert if the feed is loading', () => {
      const component = mount(SubmissionComment, mountOptions({ feed: null }));
      component.find('[role="alert"]').exists().should.be.false();
    });

    it('does not show the alert if the user did not make an edit', () => {
      const user = testData.extendedUsers.createPast(1).last();
      const component = mount(SubmissionComment, mountOptions({
        feed: [
          testData.extendedAudits.createNew({ action: 'submission.create' }),
          testData.extendedAudits.createNew({
            actor: user,
            action: 'submission.update.version'
          })
        ].reverse()
      }));
      component.find('[role="alert"]').exists().should.be.false();
    });

    it('does not show the alert if the user commented after their edit', () => {
      const component = mount(SubmissionComment, mountOptions({
        feed: [
          testData.extendedAudits.createNew({ action: 'submission.create' }),
          testData.extendedAudits.createNew({
            action: 'submission.update.version'
          }),
          testData.extendedComments.createNew()
        ].reverse()
      }));
      component.find('[role="alert"]').exists().should.be.false();
    });

    it('shows the alert if the user did not comment', () => {
      const component = mount(SubmissionComment, mountOptions({
        feed: [
          testData.extendedAudits.createNew({ action: 'submission.create' }),
          testData.extendedAudits.createNew({
            action: 'submission.update.version'
          })
        ].reverse()
      }));
      component.find('[role="alert"]').exists().should.be.true();
    });

    it('shows the alert if the user commented before their edit', () => {
      const component = mount(SubmissionComment, mountOptions({
        feed: [
          testData.extendedAudits.createNew({ action: 'submission.create' }),
          testData.extendedComments.createNew(),
          testData.extendedAudits.createNew({
            action: 'submission.update.version'
          })
        ].reverse()
      }));
      component.find('[role="alert"]').exists().should.be.true();
    });

    it('shows the alert if another user commented', () => {
      const user = testData.extendedUsers.createPast(1).last();
      const component = mount(SubmissionComment, mountOptions({
        feed: [
          testData.extendedAudits.createNew({ action: 'submission.create' }),
          testData.extendedAudits.createNew({
            action: 'submission.update.version'
          }),
          testData.extendedComments.createNew({ actor: user })
        ].reverse()
      }));
      component.find('[role="alert"]').exists().should.be.true();
    });
  });

  it('shows the actions if the user should comment after editing', () => {
    testData.extendedSubmissions.createNew();
    const component = mount(SubmissionComment, mountOptions({
      feed: [
        testData.extendedAudits.createNew({ action: 'submission.create' }),
        testData.extendedAudits.createNew({
          action: 'submission.update.version'
        })
      ].reverse()
    }));
    component.getComponent(MarkdownTextarea).props().showFooter.should.be.true();
  });

  it('shows the actions during the request', () => {
    testData.extendedSubmissions.createPast(1);
    return mockHttp()
      .mount(SubmissionComment, mountOptions())
      .request(async (component) => {
        await component.setData({ body: 'foo' }); // Linked to child's 'value' prop and textarea
        return component.get('form').trigger('submit');
      })
      .beforeAnyResponse(async (component) => {
        await component.setData({ body: '' }); // Linked to child's 'value' prop and textarea
        component.getComponent(MarkdownTextarea).props().showFooter.should.be.true();
      })
      .respondWithProblem();
  });

  it('sends the correct request', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
    testData.extendedSubmissions.createPast(1, { instanceId: 'c d' });
    return mockHttp()
      .mount(SubmissionComment, mountOptions())
      .request(async (component) => {
        await component.setData({ body: 'foo' });
        return component.get('form').trigger('submit');
      })
      .beforeEachResponse((_, { method, url, data }) => {
        method.should.equal('POST');
        url.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/comments');
        data.should.eql({ body: 'foo' });
      })
      .respondWithProblem();
  });

  it('implements some standard button things', () => {
    testData.extendedSubmissions.createPast(1);
    return mockHttp()
      .mount(SubmissionComment, mountOptions())
      .testStandardButton({
        button: 'button[type="submit"]',
        request: async (component) => {
          await component.setData({ body: 'foo' });
          return component.get('form').trigger('submit');
        }
      });
  });

  it('should make the textarea required', async () => {
    testData.extendedSubmissions.createPast(1);
    const component = mount(SubmissionComment, mountOptions());
    component.getComponent(MarkdownTextarea).props().required.should.equal(true);
  });

  describe('after a successful response', () => {
    const submit = () => {
      testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
      testData.extendedSubmissions.createPast(1, { instanceId: 'c d' });
      testData.extendedAudits.createPast(1, { action: 'submission.create' });
      return load('/projects/1/forms/a%20b/submissions/c%20d', { root: false })
        .complete()
        .request(async (component) => {
          const form = component.getComponent(SubmissionComment);
          await form.setData({ body: 'foo' });
          return form.trigger('submit');
        })
        .respondWithData(() =>
          testData.standardComments.createNew({ body: 'foo' }))
        .respondWithData(() => testData.extendedAudits.sorted())
        .respondWithData(() => testData.extendedComments.sorted())
        .respondWithData(() => ({}));
    };

    it('sends the correct requests for activity data', () =>
      submit().beforeEachResponse((_, { method, url, headers }, index) => {
        if (index === 0) return;
        method.should.equal('GET');
        if (index === 1) {
          url.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/audits');
          headers['X-Extended-Metadata'].should.equal('true');
        } else if (index === 2) {
          url.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/comments');
          headers['X-Extended-Metadata'].should.equal('true');
        } else if (index === 3) {
          url.should.equal('/v1/projects/1/forms/a%20b/submissions/c%20d/diffs');
        }
      }));

    it('resets the field', async () => {
      const component = await submit();
      component.getComponent(MarkdownTextarea).props().modelValue.should.equal('');
    });
  });
});
