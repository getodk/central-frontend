import BackupList from '../../../src/components/backup/list.vue';
import BackupTerminate from '../../../src/components/backup/terminate.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

describe('BackupTerminate', () => {
  beforeEach(mockLogin);

  describe('modal', () => {
    it('does not show the modal initially', () =>
      mockHttp()
        .mount(BackupList)
        .respondWithData(() => testData.backups.createPast(1).last())
        .respondWithData(() => testData.standardAudits.sorted())
        .afterResponses(component => {
          component.first(BackupTerminate).getProp('state').should.be.false();
        }));

    it('shows the modal after the terminate button is clicked', () =>
      mockHttp()
        .mount(BackupList)
        .respondWithData(() => testData.backups.createPast(1).last())
        .respondWithData(() => testData.standardAudits.sorted())
        .afterResponses(component =>
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
      .respondWithData(() => testData.standardAudits.sorted())
      .afterResponses(component => {
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
