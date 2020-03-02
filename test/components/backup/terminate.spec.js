import BackupList from '../../../src/components/backup/list.vue';
import BackupTerminate from '../../../src/components/backup/terminate.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

describe('BackupTerminate', () => {
  beforeEach(mockLogin);

  it('shows the modal after the button is clicked', () =>
    mockHttp()
      .mount(BackupList)
      .respondWithData(() =>
        testData.standardBackupsConfigs.createPast(1).last())
      .respondWithData(() => testData.standardAudits.sorted())
      .afterResponses(component => {
        component.first(BackupTerminate).getProp('state').should.be.false();
        return trigger.click(component, '#backup-status button');
      })
      .then(component => {
        component.first(BackupTerminate).getProp('state').should.be.true();
      }));

  it('implements some standard button things', () =>
    mockHttp()
      .mount(BackupTerminate)
      .request(component =>
        trigger.click(component, '#backup-terminate .btn-danger'))
      .standardButton('.btn-danger'));

  describe('after a successful response', () => {
    let app;
    beforeEach(() => mockRoute('/system/backups')
      .respondWithData(() =>
        testData.standardBackupsConfigs.createPast(1).last())
      .respondWithData(() => testData.standardAudits.sorted())
      .afterResponses(component => {
        app = component;
      })
      .request(() => trigger.click(app, '#backup-status button')
        .then(() => trigger.click(app, '#backup-terminate .btn-danger')))
      .respondWithSuccess());

    it('hides the modal', () => {
      app.first(BackupTerminate).getProp('state').should.be.false();
    });

    it('updates the backups status', () => {
      const { backupsConfig } = app.vm.$store.state.request.data;
      backupsConfig.isEmpty().should.be.true();
    });

    it('shows a success alert', () => {
      app.should.alert('success');
    });
  });
});
