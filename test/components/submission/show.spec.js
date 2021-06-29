import NotFound from '../../../src/components/not-found.vue';
import PageBack from '../../../src/components/page/back.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('SubmissionShow', () => {
  beforeEach(mockLogin);

  it('requires the projectId route param to be integer', async () => {
    const component = await load('/projects/p/forms/f/submissions/s', {
      root: false
    });
    component.findComponent(NotFound).exists().should.be.true();
  });

  it('renders a back link', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a b', submissions: 1 });
    testData.extendedSubmissions.createPast(1, { instanceId: 's' });
    const component = await load('/projects/1/forms/a%20b/submissions/s', {
      root: false
    });
    const { to } = component.getComponent(PageBack).props();
    to.should.equal('/projects/1/forms/a%20b/submissions');
  });

  it('shows the instance name if the submission has one', async () => {
    testData.extendedForms.createPast(1, {
      fields: [
        testData.fields.string('/meta/instanceName'),
        testData.fields.string('/s')
      ],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1, {
      instanceId: 's',
      meta: { instanceName: 'My Submission' }
    });
    const component = await load('/projects/1/forms/f/submissions/s', {
      root: false
    });
    component.get('#page-head-title').text().should.equal('My Submission');
  });

  it('shows instance ID if submission does not have an instance name', async () => {
    testData.extendedSubmissions.createPast(1, { instanceId: 's' });
    const component = await load('/projects/1/forms/f/submissions/s', {
      root: false
    });
    component.get('#page-head-title').text().should.equal('s');
  });
});
