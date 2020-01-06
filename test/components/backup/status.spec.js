import BackupStatus from '../../../src/components/backup/status.vue';
import testData from '../../data';
import { formatDate } from '../../../src/util/util';
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
        backupsConfig: testData.backups
          .createPast(1, { recentAttemptsForCurrent: [true] })
          .last()
      }
    });

    assertContent(
      component,
      'icon-check-circle',
      'Backup is working.',
      'Terminate'
    );

    const mrla = component.first('#backup-status-most-recently-logged-at');
    const { loggedAt } = testData.backups.last().recent[0];
    mrla.text().trim().should.equal(formatDate(loggedAt));
  });

  it('renders correctly if the latest recent attempt was a failure', () => {
    const component = mountAndMark(BackupStatus, {
      requestData: {
        backupsConfig: testData.backups
          .createPast(1, { recentAttemptsForCurrent: [false] })
          .last()
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
          backupsConfig: testData.backups
            .createPast(1, {
              recentlySetUp: true,
              recentAttemptsForCurrent: []
            })
            .last()
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
          backupsConfig: testData.backups
            .createPast(1, {
              recentlySetUp: false,
              recentAttemptsForCurrent: []
            })
            .last()
        }
      });
      assertContent(
        component,
        'icon-times-circle',
        'Something is wrong!',
        'Terminate'
      );
    });

    it('renders correctly if latest recent attempt for a previous config failed', () => {
      const component = mountAndMark(BackupStatus, {
        requestData: {
          backupsConfig: testData.backups
            .createPast(1, {
              recentlySetUp: true,
              recentAttemptsForCurrent: [],
              recentAttemptsForPrevious: [false]
            })
            .last()
        }
      });
      assertContent(
        component,
        'icon-check-circle',
        'The configured backup has not yet run.',
        'Terminate'
      );
    });
  });
});
