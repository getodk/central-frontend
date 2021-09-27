import AuditTable from '../../../src/components/audit/table.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('AnalyticsList', () => {
  beforeEach(mockLogin);

  it('sends the correct initial requests', () =>
    load('/system/analytics', { root: false }).testRequests([
      { url: '/v1/config/analytics' },
      { url: '/v1/audits?action=analytics&limit=10' }
    ]));

  describe('audit log', () => {
    it('renders a table if there are audit log entries', async () => {
      testData.extendedAudits.createPast(1, { action: 'analytics' });
      const component = await load('/system/analytics', { root: false });
      component.findComponent(AuditTable).exists().should.be.true();
    });

    it('does not render a table if there are no audit log entries', async () => {
      const component = await load('/system/analytics', { root: false });
      component.findComponent(AuditTable).exists().should.be.false();
    });
  });
});
