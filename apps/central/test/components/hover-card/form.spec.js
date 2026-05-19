import DateTime from '../../../src/components/date-time.vue';
import FormVersionString from '../../../src/components/form-version/string.vue';
import HoverCardForm from '../../../src/components/hover-card/form.vue';

import useHoverCardResources from '../../../src/request-data/hover-card';

import testData from '../../data';
import { findDd } from '../../util/dom';
import { mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = () => mount(HoverCardForm, {
  container: {
    requestData: testRequestData([useHoverCardResources], {
      form: testData.extendedForms.last()
    })
  }
});

describe('HoverCardForm', () => {
  describe('title', () => {
    it("shows the form's name if it has one", () => {
      testData.extendedForms.createPast(1, { name: 'My Form' });
      mountComponent().get('.hover-card-title').text().should.equal('My Form');
    });

    it('shows the xmlFormId if the form does not have a name', () => {
      testData.extendedForms.createPast(1);
      mountComponent().get('.hover-card-title').text().should.equal('f');
    });
  });

  it('shows the form version string', () => {
    testData.extendedForms.createPast(1);
    const component = mountComponent();
    const { version } = component.getComponent(FormVersionString).props();
    version.should.equal('v1');
  });

  it('shows the submission count', () => {
    testData.extendedForms.createPast(1, { submissions: 1234 });
    findDd(mountComponent(), 'Submissions').text().should.equal('1,234');
  });

  it('shows the timestamp of the latest submission', () => {
    const lastSubmission = new Date().toISOString();
    testData.extendedForms.createPast(1, { lastSubmission });
    const dd = findDd(mountComponent(), 'Latest Submission');
    dd.getComponent(DateTime).props().iso.should.equal(lastSubmission);
  });
});
