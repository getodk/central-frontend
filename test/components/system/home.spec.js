import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('SystemHome', () => {
  beforeEach(mockLogin);

  it('sets the correct href attributes for the tabs', async () => {
    const app = await load('/system/backups');
    const a = app.findAll('#page-head-tabs a');
    a.wrappers.map(wrapper => wrapper.attributes().href).should.eql([
      '/system/backups',
      '/system/audits',
      '/system/analytics'
    ]);
  });

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

    it('activates correct tab after user navigates to .../analytics', async () => {
      const app = await load('/system/analytics');
      const active = app.findAll('#page-head-tabs .active');
      active.length.should.equal(1);
      const { href } = active.at(0).get('a').attributes();
      href.should.endWith('/system/analytics');
    });
  });
});
