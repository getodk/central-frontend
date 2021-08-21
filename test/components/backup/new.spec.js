import BackupNew from '../../../src/components/backup/new.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

describe('BackupNew', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () =>
    load('/system/backups', { root: false }).testModalToggles({
      modal: BackupNew,
      show: '#backup-status button',
      hide: '.btn-link'
    }));

  describe('step 1', () => {
    it('focuses the input', () => {
      const modal = mount(BackupNew, {
        propsData: { state: true },
        attachTo: document.body
      });
      modal.get('input').should.be.focused();
    });

    it('sends the correct request', () =>
      mockHttp()
        .mount(BackupNew, {
          propsData: { state: true }
        })
        .request(async (modal) => {
          await modal.get('input').setValue('supersecret');
          modal.get('form').trigger('submit');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'POST',
          url: '/v1/config/backups/initiate',
          data: { passphrase: 'supersecret' }
        }]));

    it('implements some standard button things', () =>
      mockHttp()
        .mount(BackupNew, {
          propsData: { state: true }
        })
        .testStandardButton({
          button: '.btn-primary',
          request: (modal) => modal.get('form').trigger('submit'),
          disabled: ['.btn-link'],
          modal: true
        }));
  });

  describe('step 3', () => {
    it('focuses the input', () =>
      mockHttp()
        .mount(BackupNew, {
          propsData: { state: true },
          attachTo: document.body
        })
        .request(modal => modal.get('form').trigger('submit'))
        .respondWithData(() => ({ url: 'http://localhost', token: 'foo' }))
        .afterResponse(async (modal) => {
          await modal.get('.btn-primary').trigger('click');
          modal.get('input').should.be.focused();
        }));

    it('sends the correct request', () =>
      mockHttp()
        .mount(BackupNew, {
          propsData: { state: true }
        })
        .request(modal => modal.get('form').trigger('submit'))
        .respondWithData(() => ({ url: 'http://localhost', token: 'foo' }))
        .afterResponse(modal => modal.get('.btn-primary').trigger('click'))
        .request(async (modal) => {
          await modal.get('input').setValue('bar');
          return modal.get('form').trigger('submit');
        })
        .respondWithProblem()
        .testRequests([{
          method: 'POST',
          url: '/v1/config/backups/verify',
          headers: { Authorization: 'Bearer foo' },
          data: { code: 'bar' }
        }]));

    it('implements some standard button things', () =>
      mockHttp()
        .mount(BackupNew, {
          propsData: { state: true }
        })
        .request(modal => modal.get('form').trigger('submit'))
        .respondWithData(() => ({ url: 'http://localhost', token: 'foo' }))
        .afterResponse(modal => modal.get('.btn-primary').trigger('click'))
        .testStandardButton({
          button: '.btn-primary',
          request: async (modal) => {
            await modal.get('input').setValue('bar');
            return modal.get('form').trigger('submit');
          },
          disabled: ['.btn-link'],
          modal: true
        }));

    it('shows a custom alert message', () =>
      mockHttp()
        .mount(BackupNew, {
          propsData: { state: true }
        })
        .request(modal => modal.get('form').trigger('submit'))
        .respondWithData(() => ({ url: 'http://localhost', token: 'foo' }))
        .afterResponse(modal => modal.get('.btn-primary').trigger('click'))
        .request(async (modal) => {
          await modal.get('input').setValue('bar');
          return modal.get('form').trigger('submit');
        })
        .respondWithProblem({ code: 500.1, message: 'Failed: BackupNew.' })
        .afterResponse(modal => {
          modal.should.alert(
            'danger',
            'Failed: BackupNew. Please try again, and go to the community forum if the problem continues.'
          );
        }));
  });

  describe('after setup is successful', () => {
    const setup = () => load('/system/backups', { root: false })
      .complete()
      .request(async (component) => {
        await component.get('#backup-status button').trigger('click');
        return component.get('#backup-new form').trigger('submit');
      })
      .respondWithData(() => ({ url: 'http://localhost', token: 'foo' }))
      .afterResponse(component =>
        component.get('#backup-new .btn-primary').trigger('click'))
      .request(async (component) => {
        const modal = component.getComponent(BackupNew);
        await modal.get('input').setValue('bar');
        return modal.get('form').trigger('submit');
      })
      .respondWithData(() => {
        testData.standardConfigs.createNew({
          key: 'backups',
          value: { type: 'google' }
        });
        return { success: true };
      })
      .respondWithData(() => testData.standardConfigs.forKey('backups'))
      .respondWithData(() => testData.standardAudits.sorted());

    it('hides the modal', async () => {
      const component = await setup();
      component.getComponent(BackupNew).props().state.should.be.false();
    });

    it('updates the backups status', async () => {
      const component = await setup();
      const { backupsConfig } = component.vm.$store.state.request.data;
      backupsConfig.isDefined().should.be.true();
    });

    it('shows a success alert', async () => {
      const component = await setup();
      component.should.alert('success');
    });
  });
});
