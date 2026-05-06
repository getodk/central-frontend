import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('AuditList', () => {
  beforeEach(mockLogin);

  it('sends the correct request', () =>
    load('/system/audits', { root: false })
      .beforeEachResponse((component, { method, url, headers }) => {
        method.should.equal('GET');
        // We test the query parameters in the AuditFilters tests.
        url.should.startWith('/v1/audits?');
        headers['X-Extended-Metadata'].should.equal('true');
      }));

  it('shows a message if there are no audit log entries', () =>
    load('/system/audits', { root: false }).then(component => {
      component.get('.empty-table-message').should.be.visible();
    }));
});
