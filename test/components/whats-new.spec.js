import Modal from '../../src/components/modal.vue';
import WhatsNew from '../../src/components/whats-new.vue';

import testData from '../data';
import { load } from '../util/http';
import { mockLogin } from '../util/session';

describe.only('WhatsNew modal', () => {
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
      mockLogin({ role: 'none' });
      testData.extendedProjects.createPast(1, { role: 'manager' });
      const app = await load('/', { root: false }, { users: false });
      const baseModal = app.findComponent(WhatsNew).findComponent(Modal);
      baseModal.exists().should.be.true;
      baseModal.props().state.should.be.true;
    });

    it.skip('shows image in modal', async () => {
      mockLogin({ createdAt: '2025-01-01' });
      const app = await load('/', { root: false });
      const baseModal = app.findComponent(WhatsNew).findComponent(Modal);
      const img = baseModal.find('img');
      img.attributes('src').should.contain('newdraft');
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
      mockLogin({ createdAt: '2025-01-01' });
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
});
