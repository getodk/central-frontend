import BackupTerminate from '../../../src/components/backup/terminate.vue';

import testData from '../../data';
import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('BackupTerminate', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () => {
    testData.standardConfigs.createPast(1, {
      key: 'backups',
      value: { type: 'google' }
    });
    return load('/system/backups', { root: false }).testModalToggles({
      modal: BackupTerminate,
      show: '#backup-status button',
      hide: '.btn-link'
    });
  });

  it('sends the correct request', () =>
    mockHttp()
      .mount(BackupTerminate, {
        props: { state: true }
      })
      .request(modal => modal.get('.btn-danger').trigger('click'))
      .respondWithProblem()
      .testRequests([{ method: 'DELETE', url: '/v1/config/backups' }]));

  it('implements some standard button things', () =>
    mockHttp()
      .mount(BackupTerminate, {
        props: { state: true }
      })
      .testStandardButton({
        button: '.btn-danger',
        disabled: ['.btn-link'],
        modal: true
      }));

  describe('after a successful response', () => {
    const submit = () => {
      testData.standardConfigs.createPast(1, {
        key: 'backups',
        value: { type: 'google' }
      });
      return load('/system/backups', { root: false })
        .complete()
        .request(async (component) => {
          await component.get('#backup-status button').trigger('click');
          return component.get('#backup-terminate .btn-danger').trigger('click');
        })
        .respondWithSuccess();
    };

    it('hides the modal', async () => {
      const component = await submit();
      component.getComponent(BackupTerminate).props().state.should.be.false();
    });

    it('updates the backups status', async () => {
      const component = await submit();
      component.vm.backupsConfig.isEmpty().should.be.true();
    });

    it('shows a success alert', async () => {
      const component = await submit();
      component.should.alert('success');
    });
  });
});
