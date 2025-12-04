import Modal from '../../src/components/modal.vue';
import WhatsNew from '../../src/components/whats-new.vue';

import testData from '../data';
import { load } from '../util/http';
import { mockLogin } from '../util/session';

describe('WhatsNew modal', () => {
  describe('shows modal', () => {
    it('shows modal to admin with 0 projects', async () => {
      mockLogin({ createdAt: '2025-01-01' });
      const app = await load('/', { root: false });
      const baseModal = app.findComponent(WhatsNew).findComponent(Modal);
      baseModal.exists().should.be.true;
      baseModal.props().state.should.be.true;
    });

    it('shows modal to admin with populated projects', async () => {
      mockLogin({ createdAt: '2025-01-01' });
      testData.extendedProjects.createPast(1);
      const app = await load('/', { root: false });
      const baseModal = app.findComponent(WhatsNew).findComponent(Modal);
      baseModal.exists().should.be.true;
      baseModal.props().state.should.be.true;
    });

    it('shows modal to project manager with 1 project', async () => {
      mockLogin({ role: 'none', createdAt: '2025-01-01' });
      testData.extendedProjects.createPast(1, { role: 'manager' });
      const app = await load('/', { root: false }, { users: false });
      const baseModal = app.findComponent(WhatsNew).findComponent(Modal);
      baseModal.exists().should.be.true;
      baseModal.props().state.should.be.true;
    });

    it('shows image in modal', async () => {
      mockLogin({ createdAt: '2025-01-01' });
      const app = await load('/', { root: false });
      const baseModal = app.findComponent(WhatsNew).findComponent(Modal);
      const img = baseModal.find('img');
      img.attributes('src').should.contain('banner');
    });
  });

  describe('does not show modal', () => {
    it('does not show modal to newly created admin', async () => {
      mockLogin({ createdAt: '2025-05-07' });
      testData.extendedProjects.createPast(1);
      const app = await load('/', { root: false });
      const baseModal = app.findComponent(WhatsNew).findComponent(Modal);
      baseModal.exists().should.be.true;
      baseModal.props().state.should.be.false;
    });

    it('does not show modal to project viewer with no management role', async () => {
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'viewer' });
      const app = await load('/', { root: false }, { users: false });
      const baseModal = app.findComponent(WhatsNew).findComponent(Modal);
      baseModal.exists().should.be.true;
      baseModal.props().state.should.be.false;
    });

    it('does not show modal if already dismissed (user preference set)', async () => {
      mockLogin({ createdAt: '2025-01-01', preferences: { site: { whatsNewDismissed2025_1: true }, projects: {} } });
      const app = await load('/', { root: false });
      const baseModal = app.findComponent(WhatsNew).findComponent(Modal);
      baseModal.exists().should.be.true;
      baseModal.props().state.should.be.false;
    });
  });

  describe('set user preference', () => {
    it('sets the whatsNewDismissed2025_1 preference when modal closed', async () => {
      // Include preference for having already opted into mailing list.
      mockLogin({ createdAt: '2025-01-01', preferences: { site: { mailingListOptIn: true } } });
      await load('/', { root: false })
        .complete()
        .request(app => app.findComponent(WhatsNew).find('.btn').trigger('click'))
        .beforeEachResponse((_, { method, url, data }) => {
          method.should.equal('PUT');
          url.should.equal('/v1/user-preferences/site/whatsNewDismissed2025_1');
          data.propertyValue.should.be.equal(true);
        })
        .respondWithSuccess();
    });
  });

  describe('mailing list opt in', () => {
    it('dismissal button text', async () => {
      // Setting default mailingListOptIn to false prevents extra request being sent to change it.
      mockLogin({ createdAt: '2025-01-01', preferences: { site: { mailingListOptIn: false } } });
      await load('/', { root: false })
        .complete()
        .request(app => app.findComponent(WhatsNew).get('.modal-actions > button').text().should.equal('Done'));
    });

    it('if opted in, does NOT show checkbox or send request to change pref.', async () => {
      // Setting default mailingListOptIn to false prevents extra request being sent to change it.
      mockLogin({ createdAt: '2025-01-01', preferences: { site: { mailingListOptIn: true } } });
      await load('/', { root: false })
        .complete()
        .request(async (app) => {
          const whatsNew = app.findComponent(WhatsNew);
          whatsNew.find('input[type="checkbox"]').exists().should.be.false;
          await whatsNew.find('.btn').trigger('click');
        })
        .respondWithSuccess()
        .testRequests([
          { url: '/v1/user-preferences/site/whatsNewDismissed2025_1', method: 'PUT', data: { propertyValue: true } },
        ]);
    });

    it('if opted out, shows checkbox. if then checked, sends request to opt in to mailing list when dismissing modal.', async () => {
      // Setting default mailingListOptIn to false prevents extra request being sent to change it.
      mockLogin({ createdAt: '2025-01-01', preferences: { site: { mailingListOptIn: false } } });
      await load('/', { root: false })
        .complete()
        .request(async (app) => {
          const whatsNew = app.findComponent(WhatsNew);
          // should show unchecked if user has opted out
          app.get('input[type="checkbox"]').element.checked.should.be.false;
          await whatsNew.get('input[type="checkbox"]').setValue(true);
          await whatsNew.find('.btn').trigger('click');
        })
        .respondWithSuccess()
        .respondWithSuccess()
        .testRequests([
          { url: '/v1/user-preferences/site/whatsNewDismissed2025_1', method: 'PUT', data: { propertyValue: true } },
          { url: '/v1/user-preferences/site/mailingListOptIn', method: 'PUT', data: { propertyValue: true } },
        ]);
    });

    it('if opted out, shows checkbox. if no change, does NOT send opt-in request when dismissing modal', async () => {
      // Setting default mailingListOptIn to false prevents extra request being sent to change it.
      mockLogin({ createdAt: '2025-01-01', preferences: { site: { mailingListOptIn: false } } });
      await load('/', { root: false })
        .complete()
        .request(async (app) => {
          const whatsNew = app.findComponent(WhatsNew);
          // should show unchecked if user has opted out
          app.get('input[type="checkbox"]').element.checked.should.be.false;
          await whatsNew.find('.btn').trigger('click');
        })
        .respondWithSuccess()
        .testRequests([
          { url: '/v1/user-preferences/site/whatsNewDismissed2025_1', method: 'PUT', data: { propertyValue: true } },
        ]);
    });

    it('if no pref yet, shows checked checkbox. if left checked, sends request to explicitly opt IN.', async () => {
      // Setting default mailingListOptIn to false prevents extra request being sent to change it.
      mockLogin({ createdAt: '2025-01-01' });
      await load('/', { root: false })
        .complete()
        .request(async (app) => {
          const whatsNew = app.findComponent(WhatsNew);
          // should show checked by default if user has made no choice yet.
          app.get('input[type="checkbox"]').element.checked.should.be.true;
          await whatsNew.find('.btn').trigger('click');
        })
        .respondWithSuccess()
        .respondWithSuccess()
        .testRequests([
          { url: '/v1/user-preferences/site/whatsNewDismissed2025_1', method: 'PUT', data: { propertyValue: true } },
          { url: '/v1/user-preferences/site/mailingListOptIn', method: 'PUT', data: { propertyValue: true } },
        ]);
    });

    it('if no pref yet, shows checkbox. if explicitly unchecked checked, sends request to explicitly opt OUT.', async () => {
      // Setting default mailingListOptIn to false prevents extra request being sent to change it.
      mockLogin({ createdAt: '2025-01-01' });
      await load('/', { root: false })
        .complete()
        .request(async (app) => {
          const whatsNew = app.findComponent(WhatsNew);
          // should show checked by default if user has made no choice yet.
          app.get('input[type="checkbox"]').element.checked.should.be.true;
          await whatsNew.get('input[type="checkbox"]').setValue(false);
          await whatsNew.find('.btn').trigger('click');
        })
        .respondWithSuccess()
        .respondWithSuccess()
        .testRequests([
          { url: '/v1/user-preferences/site/whatsNewDismissed2025_1', method: 'PUT', data: { propertyValue: true } },
          { url: '/v1/user-preferences/site/mailingListOptIn', method: 'PUT', data: { propertyValue: false } },
        ]);
    });
  });
});
