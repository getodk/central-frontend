import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('SystemHome', () => {
  beforeEach(mockLogin);

  it('sets the correct href attributes for the tabs', () =>
    load('/system/backups').then(app => {
      const a = app.findAll('#page-head-tabs a');
      a.length.should.equal(2);
      a.at(0).attributes().href.should.endWith('/system/backups');
      a.at(1).attributes().href.should.endWith('/system/audits');
    }));

  describe('active tab', () => {
    it('activates correct tab after user navigates to .../backups', () =>
      load('/system/backups').then(app => {
        const active = app.findAll('#page-head-tabs .active');
        active.length.should.equal(1);
        const { href } = active.at(0).get('a').attributes();
        href.should.endWith('/system/backups');
      }));

    it('activates correct tab after user navigates to .../audits', () =>
      load('/system/audits').then(app => {
        const active = app.findAll('#page-head-tabs .active');
        active.length.should.equal(1);
        const { href } = active.at(0).get('a').attributes();
        href.should.endWith('/system/audits');
      }));
  });
});
