import BackupStatus from '../../../src/components/backup/status.vue';
import testData from '../../data';
import { ago, formatDate } from '../../../src/util/date-time';
import { mockLogin } from '../../util/session';
import { mountAndMark } from '../../util/destroy';

const assertContent = (component, iconClass, title, buttonText) => {
  const icon = component.first('#backup-status-icon');
  icon.hasClass(iconClass).should.be.true();

  const status = component.first('#backup-status');
  status.first('p').text().trim().should.equal(title);

  status.first('button').text().trim().should.equal(buttonText);
};

describe('BackupStatus', () => {
  beforeEach(mockLogin);

  it('renders correctly if backups are not configured', () => {
    const component = mountAndMark(BackupStatus, {
      requestData: {
        backupsConfig: {
          status: 404,
          data: {
            code: 404.1,
            message: 'Problem'
          }
        }
      }
    });
    assertContent(
      component,
      'icon-question-circle',
      'Backups are not configured.',
      'Set up now'
    );
  });

  it('renders correctly if the latest recent attempt was a success', () => {
    const component = mountAndMark(BackupStatus, {
      requestData: {
        backupsConfig: testData.standardBackupsConfigs
          .createPast(1, { setAt: ago({ days: 4 }).toISO() })
          .last(),
        audits: testData.standardAudits
          .createBackupAudit({
            success: true,
            loggedAt: ago({ days: 2 }).toISO()
          })
          .sorted()
      }
    });

    assertContent(
      component,
      'icon-check-circle',
      'Backup is working.',
      'Terminate'
    );

    const mrla = component.first('#backup-status-most-recently-logged-at');
    const { loggedAt } = testData.extendedAudits.last();
    mrla.text().trim().should.equal(formatDate(loggedAt));
  });

  it('renders correctly if the latest recent attempt was a failure', () => {
    const component = mountAndMark(BackupStatus, {
      requestData: {
        backupsConfig: testData.standardBackupsConfigs
          .createPast(1, { setAt: ago({ days: 2 }).toISO() })
          .last(),
        audits: testData.standardAudits
          .createBackupAudit({
            success: false,
            loggedAt: ago({ days: 1 }).toISO()
          })
          .sorted()
      }
    });
    assertContent(
      component,
      'icon-times-circle',
      'Something is wrong!',
      'Terminate'
    );
  });

  describe('no recent attempt for the current config', () => {
    it('renders correctly if the config was recently set up', () => {
      const component = mountAndMark(BackupStatus, {
        requestData: {
          backupsConfig: testData.standardBackupsConfigs
            .createPast(1, { setAt: ago({ days: 2 }).toISO() })
            .last(),
          audits: []
        }
      });
      assertContent(
        component,
        'icon-check-circle',
        'The configured backup has not yet run.',
        'Terminate'
      );
    });

    it('renders correctly if latest attempt was a recent failure for previous config', () => {
      const component = mountAndMark(BackupStatus, {
        requestData: {
          backupsConfig: testData.standardBackupsConfigs
            .createPast(1, { setAt: ago({ days: 1 }).toISO() })
            .last(),
          audits: testData.standardAudits
            .createBackupAudit({
              success: false,
              loggedAt: ago({ days: 2 }).toISO()
            })
            .sorted()
        }
      });
      assertContent(
        component,
        'icon-check-circle',
        'The configured backup has not yet run.',
        'Terminate'
      );
    });

    it('renders correctly if the config was not recently set up', () => {
      const component = mountAndMark(BackupStatus, {
        requestData: {
          backupsConfig: testData.standardBackupsConfigs
            .createPast(1, { setAt: ago({ days: 4 }).toISO() })
            .last(),
          audits: []
        }
      });
      assertContent(
        component,
        'icon-times-circle',
        'Something is wrong!',
        'Terminate'
      );
    });

    it('renders correctly if latest non-recent attempt was a success', () => {
      const component = mountAndMark(BackupStatus, {
        requestData: {
          backupsConfig: testData.standardBackupsConfigs
            .createPast(1, { setAt: ago({ days: 5 }).toISO() })
            .last(),
          audits: testData.standardAudits
            .createBackupAudit({
              success: true,
              loggedAt: ago({ days: 4 }).toISO()
            })
            .sorted()
        }
      });
      assertContent(
        component,
        'icon-times-circle',
        'Something is wrong!',
        'Terminate'
      );
    });
  });
});
