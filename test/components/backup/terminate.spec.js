import BackupList from '../../../src/components/backup/list.vue';
import BackupTerminate from '../../../src/components/backup/terminate.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { trigger } from '../../util';

describe('BackupTerminate', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it('is initially hidden', () =>
      mockHttp()
        .mount(BackupList)
        .respondWithData(() => testData.backups.createPast(1).last())
        .afterResponse(page => {
          page.first(BackupTerminate).getProp('state').should.be.false();
        }));

    it('opens after button click', () =>
      mockHttp()
        .mount(BackupList)
        .respondWithData(() => testData.backups.createPast(1).last())
        .afterResponse(component =>
          trigger.click(component, '#backup-status button'))
        .then(component => {
          component.first(BackupTerminate).getProp('state').should.be.true();
        }));
  });

  it('standard button thinking things', () =>
    mockHttp()
      .mount(BackupTerminate)
      .request(component =>
        trigger.click(component, '#backup-terminate .btn-danger'))
      .standardButton('.btn-danger'));

  describe('after successful response', () => {
    let app;
    beforeEach(() => mockRoute('/system/backups')
      .respondWithData(() => testData.backups.createPast(1).last())
      .afterResponse(component => {
        app = component;
      })
      .request(() => trigger.click(app, '#backup-status button')
        .then(() => trigger.click(app, '#backup-terminate .btn-danger')))
      .respondWithSuccess());

    it('modal is hidden', () => {
      app.first(BackupTerminate).getProp('state').should.be.false();
    });

    it('backup status is updated', () => {
      const { backupsConfig } = app.vm.$store.state.request.data;
      backupsConfig.status.should.equal('notConfigured');
    });

    it('success message is shown', () => {
      app.should.alert('success');
    });
  });
});
