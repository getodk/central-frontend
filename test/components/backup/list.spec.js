import AuditTable from '../../../src/components/audit/table.vue';

import testData from '../../data';
import { ago } from '../../../src/util/date-time';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('BackupList', () => {
  beforeEach(mockLogin);

  it('sends the correct initial requests', () =>
    load('/system/backups', { root: false }).testRequests([
      { url: '/v1/config/backups' },
      { url: '/v1/audits?action=backup&limit=10' }
    ]));

  it('renders a table if there are audit log entries', () => {
    testData.extendedAudits.createBackupAudit({
      success: false,
      loggedAt: ago({ days: 1 }).toISO()
    });
    return load('/system/backups', { root: false }).then(component => {
      component.findComponent(AuditTable).exists().should.be.true();
    });
  });

  it('does not render a table if there are no audit log entries', () =>
    load('/system/backups', { root: false }).then(component => {
      component.findComponent(AuditTable).exists().should.be.false();
    }));
});
