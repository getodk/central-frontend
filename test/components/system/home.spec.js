import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('SystemHome', () => {
  beforeEach(mockLogin);

  it('renders the tabs correctly', () =>
    load('/system/backups').then(app => {
      const a = app.find('#page-head-tabs a');
      a.length.should.equal(2);

      a[0].text().trim().should.equal('Backups');
      a[0].getAttribute('href').should.equal('#/system/backups');

      a[1].text().trim().should.equal('Server Audit Logs');
      a[1].getAttribute('href').should.equal('#/system/audits');
    }));

  describe('active tab', () => {
    it('activates correct tab after user navigates to .../backups', () =>
      load('/system/backups').then(app => {
        const active = app.find('#page-head-tabs .active');
        active.length.should.equal(1);
        const href = active[0].first('a').getAttribute('href');
        href.should.equal('#/system/backups');
      }));

    it('activates correct tab after user navigates to .../audits', () =>
      load('/system/audits').then(app => {
        const active = app.find('#page-head-tabs .active');
        active.length.should.equal(1);
        const href = active[0].first('a').getAttribute('href');
        href.should.equal('#/system/audits');
      }));
  });
});
