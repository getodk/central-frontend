import BackupList from '../../../lib/components/backup/list.vue';
import BackupTerminate from '../../../lib/components/backup/terminate.vue';
import testData from '../../data';
import { mockHttp, mockRoute } from '../../http';
import { mockLogin } from '../../session';
import { trigger } from '../../util';

const openModal = (wrapper) =>
  trigger.click(wrapper.first('#backup-list-terminate-button'))
    .then(() => wrapper);
const confirmTerminate = (wrapper) =>
  trigger.click(wrapper.first('#backup-terminate .btn-danger'))
    .then(() => wrapper);

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
        .afterResponse(openModal)
        .then(page => {
          page.first(BackupTerminate).getProp('state').should.be.true();
        }));
  });

  it('standard button thinking things', () =>
    mockHttp()
      .mount(BackupTerminate)
      .request(confirmTerminate)
      .standardButton('.btn-danger'));

  describe('after successful response', () => {
    let app;
    beforeEach(() => mockRoute('/system/backups')
      .respondWithData(() => testData.backups.createPast(1).last())
      .afterResponse(component => {
        app = component;
      })
      .request(() => openModal(app).then(confirmTerminate))
      .respondWithSuccess());

    it('modal is hidden', () => {
      app.first(BackupTerminate).getProp('state').should.be.false();
    });

    it('backup status is updated', () => {
      app.first(BackupList).data().backups.status.should.equal('notConfigured');
    });

    it('success message is shown', () => {
      app.should.alert('success');
    });
  });
});
