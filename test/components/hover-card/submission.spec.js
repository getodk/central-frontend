import DateTime from '../../../src/components/date-time.vue';
import HoverCardSubmission from '../../../src/components/hover-card/submission.vue';

import useHoverCardResources from '../../../src/request-data/hover-card';

import testData from '../../data';
import { findDd } from '../../util/dom';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => mount(HoverCardSubmission, {
  container: {
    requestData: testRequestData([useHoverCardResources], {
      form: testData.standardForms.last(),
      submission: testData.submissionOData()
    })
  }
});

describe('HoverCardSubmission', () => {
  describe('title', () => {
    it('shows the instance name if the submission has one', () => {
      testData.extendedSubmissions.createPast(1, {
        meta: { instanceName: 'My Submission' }
      });
      const text = mountComponent().get('.hover-card-title').text();
      text.should.equal('My Submission');
    });

    it('falls back to showing the instance ID', () => {
      testData.extendedSubmissions.createPast(1, {
        instanceId: 'uuid:12345678-1111-2222-3333-123456789abc'
      });
      const text = mountComponent().get('.hover-card-title').text();
      text.should.equal('uuid:12345678…56789abc');
    });
  });

  describe('form', () => {
    it("shows the form's name if it has one", () => {
      testData.extendedForms.createPast(1, { name: 'My Form' });
      testData.extendedSubmissions.createPast(1);
      findDd(mountComponent(), 'Form').text().should.equal('My Form');
    });

    it('shows the xmlFormId if the form does not have a name', () => {
      testData.extendedSubmissions.createPast(1);
      findDd(mountComponent(), 'Form').text().should.equal('f');
    });
  });

  it('shows the submitter name', () => {
    testData.extendedUsers.createPast(1, { displayName: 'Alice' });
    testData.extendedSubmissions.createPast(1);
    findDd(mountComponent(), 'Submitted by').text().should.equal('Alice');
  });

  it('shows the submission date', () => {
    const { createdAt } = testData.extendedSubmissions.createPast(1).last();
    const dd = findDd(mountComponent(), 'Submitted at');
    dd.getComponent(DateTime).props().iso.should.equal(createdAt);
  });
});
