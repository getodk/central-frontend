import BackupStatus from '../../../src/components/backup/status.vue';
import DateTime from '../../../src/components/date-time.vue';
import Spinner from '../../../src/components/spinner.vue';

import testData from '../../data';
import { ago } from '../../../src/util/date-time';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { trigger } from '../../util/event';

const mountComponent = () => mount(BackupStatus, {
  requestData: {
    backupsConfig: testData.standardBackupsConfigs.last(),
    audits: testData.standardAudits.sorted()
  }
});
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
    const component = mount(BackupStatus, {
      requestData: {
        backupsConfig: { problem: 404.1 }
      }
    });
    assertContent(
      component,
      'icon-question-circle',
      'Backups are not configured.',
      'Set up now…'
    );
  });

  it('renders correctly if the latest recent attempt was a success', () => {
    const component = mount(BackupStatus, {
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
      'Terminate…'
    );

    const { loggedAt } = testData.extendedAudits.last();
    component.first(DateTime).getProp('iso').should.equal(loggedAt);
  });

  it('renders correctly if the latest recent attempt was a failure', () => {
    const component = mount(BackupStatus, {
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
      'Terminate…'
    );
  });

  describe('no recent attempt for the current config', () => {
    it('renders correctly if the config was recently set up', () => {
      const component = mount(BackupStatus, {
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
        'Terminate…'
      );
    });

    it('renders correctly if latest attempt was a recent failure for previous config', () => {
      const component = mount(BackupStatus, {
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
        'Terminate…'
      );
    });

    it('renders correctly if the config was not recently set up', () => {
      const component = mount(BackupStatus, {
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
        'Terminate…'
      );
    });

    it('renders correctly if latest non-recent attempt was a success', () => {
      const component = mount(BackupStatus, {
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
        'Terminate…'
      );
    });
  });

  describe('download link', () => {
    beforeEach(() => {
      testData.standardBackupsConfigs.createPast(1, {
        setAt: ago({ days: 1 }).toISO()
      });
    });

    it('renders the link if backups are configured', () => {
      mountComponent().find('[href="/v1/backup"]').length.should.equal(1);
    });

    describe('after the link is clicked', () => {
      it('shows a success alert', async () => {
        const app = await load('/system/backups');
        const a = app.first('#backup-status [href="/v1/backup"]');
        // Needed for Karma.
        a.element.setAttribute('target', '_blank');
        await trigger.click(a);
        app.should.alert('success');
      });

      it('disables the link', async () => {
        const a = mountComponent().first('[href="/v1/backup"]');
        a.element.setAttribute('target', '_blank');
        await trigger.click(a);
        a.hasClass('disabled').should.be.true();
      });

      it('prevents default if it is clicked again', () => {
        const a = mountComponent().first('[href="/v1/backup"]');
        a.element.setAttribute('target', '_blank');
        const click = () => a.element.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true
        }));
        click().should.be.true();
        click().should.be.false();
      });

      it('shows a spinner', async () => {
        const component = mountComponent();
        const spinners = component.find(Spinner);
        spinners.length.should.equal(1);
        spinners[0].getProp('state').should.be.false();
        const a = component.first('[href="/v1/backup"]');
        a.element.setAttribute('target', '_blank');
        await trigger.click(a);
        spinners[0].getProp('state').should.be.true();
      });
    });
  });
});
