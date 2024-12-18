import FormOverview from '../../../src/components/form/overview.vue';
import NotFound from '../../../src/components/not-found.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockResponse } from '../../util/axios';

describe('FormShow', () => {
  beforeEach(mockLogin);

  it('requires the projectId route param to be integer', async () => {
    const app = await load('/projects/p/forms/f');
    app.findComponent(NotFound).exists().should.be.true;
  });

  it('sends the correct initial requests', () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
    return load('/projects/1/forms/a%20b').testRequests([
      { url: '/v1/projects/1', extended: true },
      { url: '/v1/projects/1/forms/a%20b', extended: true },
      { url: '/v1/projects/1/forms/a%20b/draft', extended: true },
      { url: '/v1/projects/1/forms/a%20b/draft/attachments' },
      { url: '/v1/projects/1/forms/a%20b/attachments' }
    ]);
  });

  describe('requestData reconciliation', () => {
    it('updates attachments if it is defined but formDraft is not', async () => {
      testData.extendedForms.createPast(1);
      const attachments = testData.standardFormAttachments.createPast(1).sorted();
      const app = await load('/projects/1/forms/f', {}, {
        attachments: () => attachments
      });
      app.vm.$container.requestData.attachments.isEmpty().should.be.true;
    });

    it('updates formDraft if it is defined but attachments is not', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      const app = await load('/projects/1/forms/f', {}, {
        attachments: () => mockResponse.problem(404.1)
      });
      app.vm.$container.requestData.formDraft.isEmpty().should.be.true;
    });
  });

  it('re-renders the router view after a route change', () => {
    testData.extendedForms
      .createPast(1, { xmlFormId: 'f1' })
      .createPast(1, { xmlFormId: 'f2' });
    let vm;
    return load('/projects/1/forms/f1', {}, {
      form: () => testData.extendedForms.first()
    })
      .afterResponses(app => {
        vm = app.getComponent(FormOverview).vm;
      })
      .load('/projects/1/forms/f2', {
        project: false,
        form: () => testData.extendedForms.last()
      })
      .afterResponses(app => {
        expect(app.getComponent(FormOverview).vm).to.not.equal(vm);
      });
  });
});
