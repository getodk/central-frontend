import AuditRow from '../../../src/components/audit/row.vue';
import DateTime from '../../../src/components/date-time.vue';
import testData from '../../data';
import { ago } from '../../../src/util/date-time';
import { load, mockRoute } from '../../util/http';
import { mockLogin } from '../../util/session';
import { trigger } from '../../util/event';

const testTypeAndTarget = (type, target) => (app) => {
  const td = app.find('.audit-row td');

  td[1].text().trim().iTrim().should.equal(type.join(' '));

  const icons = td[1].find('.icon-angle-right');
  if (type.length === 1)
    icons.length.should.equal(0);
  else if (type.length === 2)
    icons.length.should.equal(1);
  else
    throw new Error();

  td[3].hasClass('target').should.be.true();
  if (target != null) {
    const a = td[3].first('a');
    a.text().trim().should.equal(target.text);
    a.getAttribute('title').should.equal(target.text);
    a.getAttribute('href').should.equal(`#${target.href}`);
  } else {
    td[3].text().trim().should.equal('');
    td[3].find('a').length.should.equal(0);
  }
};

describe('AuditTable', () => {
  beforeEach(() => {
    mockLogin({ displayName: 'User 1' });
  });

  it('renders loggedAt correctly', () => {
    const { loggedAt } = testData.extendedAudits
      .createPast(1, {
        actor: testData.extendedUsers.first(),
        action: 'user.update',
        actee: testData.toActor(testData.extendedUsers.first())
      })
      .last();
    return load('/system/audits').then(app => {
      app.first(AuditRow).first(DateTime).getProp('iso').should.equal(loggedAt);
    });
  });

  describe('user target', () => {
    /*
    Array of test cases, where each case is an array with the following
    structure:

    [action, type elements]
    */
    const cases = [
      ['user.create', ['User', 'Create']],
      ['user.update', ['User', 'Update Details']],
      ['assignment.create', ['User', 'Assign Role']],
      ['assignment.delete', ['User', 'Revoke Role']],
      ['user.delete', ['User', 'Retire']]
    ];

    for (const [action, type] of cases) {
      it(`renders a ${action} audit correctly`, () =>
        mockRoute('/system/audits')
          .respondWithData(() => testData.extendedAudits
            .createPast(1, {
              actor: testData.extendedUsers.first(),
              action,
              actee: testData.toActor(testData.extendedUsers
                .createPast(1, { displayName: 'User 2' })
                .last())
            })
            .sorted())
          .afterResponse(testTypeAndTarget(
            type,
            { text: 'User 2', href: '/users/2/edit' }
          )));
    }
  });

  describe('project target', () => {
    const cases = [
      ['project.create', ['Project', 'Create']],
      ['project.update', ['Project', 'Update Details']],
      ['project.delete', ['Project', 'Delete']]
    ];

    for (const [action, type] of cases) {
      it(`renders a ${action} audit correctly`, () => {
        testData.extendedAudits.createPast(1, {
          actor: testData.extendedUsers.first(),
          action,
          actee: testData.standardProjects
            .createPast(1, { name: 'My Project' })
            .last()
        });
        return load('/system/audits').then(testTypeAndTarget(
          type,
          { text: 'My Project', href: '/projects/1' }
        ));
      });
    }
  });

  describe('form target', () => {
    const cases = [
      ['form.create', ['Form', 'Create']],
      ['form.update', ['Form', 'Update Details']],
      ['form.update.draft.set', ['Form', 'Create or Update Draft']],
      ['form.update.publish', ['Form', 'Publish Draft']],
      ['form.update.draft.delete', ['Form', 'Abandon Draft']],
      ['form.attachment.update', ['Form', 'Update Attachments']],
      ['form.delete', ['Form', 'Delete']],
      ['upgrade.process.form', ['Server Upgrade', 'Process Form']],
      ['upgrade.process.form.draft', ['Server Upgrade', 'Process Form Draft']]
    ];

    for (const [action, type] of cases) {
      it(`renders a ${action} audit correctly`, () => {
        testData.extendedAudits.createPast(1, {
          actor: testData.extendedUsers.first(),
          action,
          actee: testData.standardForms
            .createPast(1, { name: 'My Form' })
            .last()
        });
        return load('/system/audits').then(testTypeAndTarget(
          type,
          { text: 'My Form', href: '/projects/1/forms/f' }
        ));
      });
    }

    it('shows the xmlFormId if the form does not have a name', () => {
      testData.extendedAudits.createPast(1, {
        actor: testData.extendedUsers.first(),
        action: 'form.create',
        actee: testData.standardForms.createPast(1, { name: null }).last()
      });
      return load('/system/audits').then(app => {
        app.find('.audit-row td')[3].first('a').text().trim().should.equal('f');
      });
    });

    it('encodes the xmlFormId in the form URL', () => {
      testData.extendedAudits.createPast(1, {
        actor: testData.extendedUsers.first(),
        action: 'form.create',
        actee: testData.standardForms.createPast(1, { xmlFormId: 'i ı' }).last()
      });
      return load('/system/audits').then(app => {
        const a = app.find('.audit-row td')[3].first('a');
        a.getAttribute('href').should.equal('#/projects/1/forms/i%20%C4%B1');
      });
    });

    it('links to .../draft for a form without a published version', () => {
      testData.extendedAudits.createPast(1, {
        actor: testData.extendedUsers.first(),
        action: 'form.create',
        actee: testData.standardForms.createPast(1, { draft: true }).last()
      });
      return load('/system/audits').then(app => {
        const a = app.find('.audit-row td')[3].first('a');
        a.getAttribute('href').should.equal('#/projects/1/forms/f/draft');
      });
    });
  });

  it('renders a backup audit correctly', () =>
    mockRoute('/system/backups')
      .respondWithData(() => testData.standardBackupsConfigs
        .createPast(1, { setAt: ago({ days: 2 }).toISO() })
        .last())
      .respondWithData(() => testData.standardAudits
        .createBackupAudit({
          success: true,
          loggedAt: ago({ days: 1 }).toISO()
        })
        .sorted())
      .afterResponses(testTypeAndTarget(['Backup'], null)));

  it('renders an audit with an unknown action correctly', () => {
    testData.extendedAudits.createPast(1, {
      action: 'unknown',
      actee: testData.toActor(testData.extendedUsers
        .createPast(1, { displayName: 'User 2' })
        .last())
    });
    return load('/system/audits').then(testTypeAndTarget(
      ['unknown'],
      null
    ));
  });

  it('renders an audit with an unknown category correctly', () => {
    testData.extendedAudits.createPast(1, {
      action: 'something.unknown',
      actee: testData.toActor(testData.extendedUsers
        .createPast(1, { displayName: 'User 2' })
        .last())
    });
    return load('/system/audits').then(testTypeAndTarget(
      ['something.unknown'],
      null
    ));
  });

  it('renders an audit with an unknown action for its category', () => {
    testData.extendedAudits.createPast(1, {
      action: 'project.unknown',
      actee: testData.standardProjects
        .createPast(1, { name: 'My Project' })
        .last()
    });
    return load('/system/audits').then(testTypeAndTarget(
      ['project.unknown'],
      { text: 'My Project', href: '/projects/1' }
    ));
  });

  describe('initiator', () => {
    it('renders correctly for an audit with an actor', () => {
      testData.extendedAudits.createPast(1, {
        actor: testData.extendedUsers.first(),
        action: 'user.create',
        actee: testData.toActor(testData.extendedUsers
          .createPast(1, { displayName: 'User 2' })
          .last())
      });
      return load('/system/audits').then(app => {
        const td = app.find('.audit-row td')[2];
        td.hasClass('initiator').should.be.true();
        const a = td.first('a');
        a.text().trim().should.equal('User 1');
        a.getAttribute('title').should.equal('User 1');
        a.getAttribute('href').should.equal('#/users/1/edit');
      });
    });

    it('renders correctly for an audit without an actor', () => {
      testData.extendedAudits.createPast(1, {
        action: 'upgrade.process.form',
        actee: testData.standardForms
          .createPast(1, { name: 'My Form' })
          .last()
      });
      return load('/system/audits').then(app => {
        const td = app.find('.audit-row td')[2];
        td.text().trim().should.equal('');
        td.find('a').length.should.equal(0);
      });
    });
  });

  it('renders details correctly', () =>
    mockRoute('/system/audits')
      .respondWithData(() => testData.extendedAudits
        .createPast(1, {
          actor: testData.extendedUsers.first(),
          action: 'user.update',
          actee: testData.toActor(testData.extendedUsers.first()),
          details: { some: 'json' }
        })
        .sorted())
      .afterResponse(app => {
        app.first('.audit-row .details').text().should.equal('{"some":"json"}');
      }));

  it('selects details after they are clicked', () =>
    mockRoute('/system/audits', { attachToDocument: true })
      .respondWithData(() => testData.extendedAudits
        .createPast(1, {
          actor: testData.extendedUsers.first(),
          action: 'user.update',
          actee: testData.toActor(testData.extendedUsers.first()),
          details: { some: 'json' }
        })
        .sorted())
      .afterResponse(app => trigger.click(app, '.audit-row .details div'))
      .then(() => {
        const selection = window.getSelection();
        const details = document.querySelector('.audit-row .details div');
        selection.anchorNode.should.equal(details);
        selection.focusNode.should.equal(details);
      }));
});
