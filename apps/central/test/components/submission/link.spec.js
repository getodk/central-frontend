import { RouterLinkStub } from '@vue/test-utils';

import SubmissionLink from '../../../src/components/submission/link.vue';

import testData from '../../data';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(SubmissionLink, {
  props: {
    projectId: 1,
    xmlFormId: testData.extendedForms.last().xmlFormId,
    submission: testData.extendedSubmissions.last()
  },
  container: { router: mockRouter('/') }
});

describe('SubmissionLink', () => {
  describe('text', () => {
    it('shows the instance name if the submission has one', () => {
      testData.extendedSubmissions.createPast(1, {
        meta: { instanceName: 'My Submission' }
      });
      mountComponent().text().should.equal('My Submission');
    });

    it('falls back to showing the instance ID', () => {
      testData.extendedSubmissions.createPast(1, { instanceId: 's' });
      mountComponent().text().should.equal('s');
    });
  });

  it('links to the submission', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a b', submissions: 1 });
    testData.extendedSubmissions.createPast(1, { instanceId: 'c d' });
    const { to } = mountComponent().getComponent(RouterLinkStub).props();
    to.should.equal('/projects/1/forms/a%20b/submissions/c%20d');
  });
});
