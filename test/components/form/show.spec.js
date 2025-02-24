import FormSettings from '../../../src/components/form/settings.vue';
import NotFound from '../../../src/components/not-found.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockResponse } from '../../util/axios';

describe('FormShow', () => {
  it('requires the projectId route param to be integer', async () => {
    mockLogin();
    const app = await load('/projects/p/forms/f/settings');
    app.findComponent(NotFound).exists().should.be.true;
  });

  describe('initial requests', () => {
    it('sends the correct requests for a sitewide administrator', () => {
      mockLogin();
      testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
      return load('/projects/1/forms/a%20b/versions').testRequests([
        { url: '/v1/projects/1', extended: true },
        { url: '/v1/projects/1/forms/a%20b', extended: true },
        { url: '/v1/projects/1/forms/a%20b/draft', extended: true },
        { url: '/v1/projects/1/forms/a%20b/draft/attachments' },
        { url: '/v1/projects/1/forms/a%20b/versions', extended: true },
        { url: '/v1/projects/1/forms/a%20b/assignments/app-user' },
        { url: '/v1/projects/1/forms/a%20b/attachments' },
        { url: '/v1/projects/1/forms/a%20b/dataset-diff' }
      ]);
    });

    it('sends the correct requests for a project viewer', () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer', forms: 1 });
      testData.extendedForms.createPast(1, { xmlFormId: 'a b' });
      return load('/projects/1/forms/a%20b/versions').testRequests([
        { url: '/v1/projects/1', extended: true },
        { url: '/v1/projects/1/forms/a%20b', extended: true },
        { url: '/v1/projects/1/forms/a%20b/draft', extended: true },
        { url: '/v1/projects/1/forms/a%20b/draft/attachments' },
        { url: '/v1/projects/1/forms/a%20b/versions', extended: true }
      ]);
    });

    it('does not send requests for entity lists if form is a draft', () => {
      mockLogin();
      testData.extendedForms.createPast(1, { xmlFormId: 'a b', draft: true });
      return load('/projects/1/forms/a%20b/draft').testRequests([
        { url: '/v1/projects/1', extended: true },
        { url: '/v1/projects/1/forms/a%20b', extended: true },
        { url: '/v1/projects/1/forms/a%20b/draft', extended: true },
        { url: '/v1/projects/1/forms/a%20b/draft/attachments' },
        { url: '/v1/projects/1/forms/a%20b/versions', extended: true },
        { url: '/v1/projects/1/forms/a%20b/assignments/app-user' }
      ]);
    });
  });

  describe('requestData reconciliation', () => {
    beforeEach(mockLogin);

    it('updates attachments if it is defined but formDraft is not', async () => {
      testData.extendedForms.createPast(1);
      const attachments = testData.standardFormAttachments.createPast(1).sorted();
      const app = await load('/projects/1/forms/f/settings', {}, {
        attachments: () => attachments
      });
      app.vm.$container.requestData.localResources.attachments.isEmpty().should.be.true;
    });

    it('updates formDraft if it is defined but attachments is not', async () => {
      testData.extendedForms.createPast(1);
      testData.extendedFormVersions.createPast(1, { draft: true });
      const app = await load('/projects/1/forms/f/settings', {}, {
        attachments: () => mockResponse.problem(404.1)
      });
      app.vm.$container.requestData.formDraft.isEmpty().should.be.true;
    });
  });

  it('re-renders the router view after a route change', () => {
    mockLogin();
    testData.extendedForms
      .createPast(1, { xmlFormId: 'f1' })
      .createPast(1, { xmlFormId: 'f2' });
    let vm;
    return load('/projects/1/forms/f1/settings', {}, {
      form: () => testData.extendedForms.first()
    })
      .afterResponses(app => {
        vm = app.getComponent(FormSettings).vm;
      })
      .load('/projects/1/forms/f2/settings', {
        project: false,
        form: () => testData.extendedForms.last()
      })
      .afterResponses(app => {
        expect(app.getComponent(FormSettings).vm).to.not.equal(vm);
      });
  });
});
