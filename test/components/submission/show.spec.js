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
    component.find(NotFound).length.should.equal(1);
  });

  it('renders a back link', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a b', submissions: 1 });
    testData.extendedSubmissions.createPast(1, { instanceId: 's' });
    const component = await load('/projects/1/forms/a%20b/submissions/s', {
      root: false
    });
    const to = component.first(PageBack).getProp('to');
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
    component.first('#page-head-title').text().should.equal('My Submission');
  });

  it('shows instance ID if submission does not have an instance name', async () => {
    testData.extendedSubmissions.createPast(1, { instanceId: 's' });
    const component = await load('/projects/1/forms/f/submissions/s', {
      root: false
    });
    component.first('#page-head-title').text().should.equal('s');
  });

  it('shows the instance ID if /meta/instanceName is not a string', async () => {
    testData.extendedForms.createPast(1, {
      fields: [
        testData.fields.int('/meta/instanceName'),
        testData.fields.string('/s')
      ],
      submissions: 1
    });
    testData.extendedSubmissions.createPast(1, {
      instanceId: 's',
      meta: { instanceName: 1 }
    });
    const component = await load('/projects/1/forms/f/submissions/s', {
      root: false
    });
    component.first('#page-head-title').text().should.equal('s');
  });
});
