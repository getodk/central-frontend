import AuditTable from '../../../src/components/audit/table.vue';
import testData from '../../data';
import { ago } from '../../../src/util/date-time';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('BackupList', () => {
  beforeEach(mockLogin);

  it('sends the correct requests', () => {
    let success = false;
    return load('/system/backups', { component: true }, {})
      .beforeEachResponse((component, { method, url }, index) => {
        method.should.equal('GET');
        if (index === 0) {
          url.should.equal('/v1/config/backups');
        } else {
          url.should.equal('/v1/audits?action=backup&limit=10');
          success = true;
        }
      })
      .then(() => {
        success.should.be.true();
      });
  });

  it('renders a table if there are audit log entries', () => {
    testData.extendedAudits.createBackupAudit({
      success: false,
      loggedAt: ago({ days: 1 }).toISO()
    });
    return load('/system/backups', { component: true }, {}).then(component => {
      component.find(AuditTable).length.should.equal(1);
    });
  });

  it('does not render a table if there are no audit log entries', () =>
    load('/system/backups', { component: true }, {}).then(component => {
      component.find(AuditTable).length.should.equal(0);
    }));
});
