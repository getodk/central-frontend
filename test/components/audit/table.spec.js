import { RouterLinkStub } from '@vue/test-utils';

import ActorLink from '../../../src/components/actor-link.vue';
import AuditRow from '../../../src/components/audit/row.vue';
import DateTime from '../../../src/components/date-time.vue';
import Selectable from '../../../src/components/selectable.vue';

import { ago } from '../../../src/util/date-time';

import testData from '../../data';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(AuditRow, {
  props: { audit: testData.extendedAudits.last() },
  container: { router: mockRouter('/system/audits') }
});
const testType = (row, type) => {
  const td = row.get('.type');
  td.text().should.equal(type.join('  '));

  const icons = td.findAll('.icon-angle-right');
  if (type.length === 1)
    icons.length.should.equal(0);
  else if (type.length === 2)
    icons.length.should.equal(1);
  else
    throw new Error('invalid type');
};
const testTarget = (row, text, to = undefined) => {
  if (text === '') {
    row.get('.target').text().should.equal('');
  } else if (to == null) {
    const span = row.get('.target span');
    span.text().should.equal(text);
    span.attributes().title.should.equal(text);
  } else {
    const link = row.findAllComponents(RouterLinkStub).find(wrapper =>
      wrapper.element.closest('.target') != null);
    link.text().should.equal(text);
    link.attributes().title.should.equal(text);
    link.props().to.should.equal(to);
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
    mountComponent().getComponent(DateTime).props().iso.should.equal(loggedAt);
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
      ['user.assignment.create', ['User', 'Assign Role']],
      ['user.assignment.delete', ['User', 'Revoke Role']],
      ['user.delete', ['User', 'Retire']]
    ];

    for (const [action, type] of cases) {
      it(`renders a ${action} audit correctly`, () => {
        const user = testData.extendedUsers
          .createPast(1, { displayName: 'User 2' })
          .last();
        testData.extendedAudits.createPast(1, {
          actor: testData.extendedUsers.first(),
          action,
          actee: testData.toActor(user)
        });
        const row = mountComponent();
        testType(row, type);
        testTarget(row, 'User 2', '/users/2/edit');
      });
    }

    it('renders a user.session.create audit correctly', () => {
      testData.extendedAudits.createPast(1, { action: 'user.session.create' });
      const row = mountComponent();
      testType(row, ['User', 'Log in']);
      testTarget(row, 'User 1', '/users/1/edit');
    });

    it('renders deleted user targets correctly', () => {
      testData.extendedUsers.createPast(1, { displayName: 'User Name' });
      const deletedUser = testData.toActor(testData.extendedUsers.last());
      deletedUser.deletedAt = ago({ days: 2 }).toISO();
      testData.extendedAudits.createPast(1, {
        actor: testData.extendedUsers.first(),
        action: 'user.delete', // will display the same way for all actions
        actee: deletedUser
      });
      const target = mountComponent().get('.target');
      target.find('a').exists().should.be.false();
      target.text().should.equal('User Name');
      const icon = target.find('.icon-trash');
      icon.exists().should.be.true();
      icon.attributes().title.should.equal('This resource has been deleted.');
    });
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
        const row = mountComponent();
        testType(row, type);
        testTarget(row, 'My Project', '/projects/1');
      });
    }

    it('renders deleted project targets correctly', () => {
      const deletedProject = testData.standardProjects
        .createPast(1, { name: 'My Project' })
        .last();
      deletedProject.deletedAt = ago({ days: 2 }).toISO();
      testData.extendedAudits.createPast(1, {
        actor: testData.extendedUsers.first(),
        action: 'project.delete', // will display the same way for all actions
        actee: deletedProject
      });
      const target = mountComponent().get('.target');
      target.find('a').exists().should.be.false();
      target.text().should.equal('My Project');
      const icon = target.find('.icon-trash');
      icon.exists().should.be.true();
      icon.attributes().title.should.equal('This resource has been deleted.');
    });
  });

  describe('form target', () => {
    const cases = [
      ['form.create', ['Form', 'Create']],
      ['form.update', ['Form', 'Update Details']],
      ['form.update.draft.set', ['Form', 'Create or Update Draft']],
      ['form.update.publish', ['Form', 'Publish Draft']],
      ['form.update.draft.delete', ['Form', 'Abandon Draft']],
      ['form.attachment.update', ['Form', 'Update Attachments']],
      ['form.submission.export', ['Form', 'Download Submissions']],
      ['form.delete', ['Form', 'Delete']],
      ['form.restore', ['Form', 'Undelete']],
      ['form.purge', ['Form', 'Purge']],
      ['upgrade.process.form', ['Server Upgrade', 'Process Form']],
      ['upgrade.process.form.draft', ['Server Upgrade', 'Process Form Draft']]
    ];

    for (const [action, type] of cases) {
      it(`renders a ${action} audit correctly`, () => {
        testData.extendedAudits.createPast(1, {
          actor: testData.extendedUsers.first(),
          action,
          actee: testData.standardForms
            .createPast(1, { xmlFormId: 'a b', name: 'My Form' })
            .last()
        });
        const row = mountComponent();
        testType(row, type);
        testTarget(row, 'My Form', '/projects/1/forms/a%20b');
      });
    }

    it('renders deleted form targets correctly', () => {
      const deletedForm = testData.standardForms
        .createPast(1, { xmlFormId: 'a', name: 'My Form' })
        .last();
      deletedForm.deletedAt = ago({ days: 2 }).toISO();
      testData.extendedAudits.createPast(1, {
        actor: testData.extendedUsers.first(),
        action: 'form.delete', // will display the same way for all actions
        actee: deletedForm
      });
      const target = mountComponent().get('.target');
      target.find('a').exists().should.be.false();
      target.text().should.equal('My Form');
      const icon = target.find('.icon-trash');
      icon.exists().should.be.true();
      icon.attributes().title.should.equal('This resource has been deleted.');
    });

    it('shows the xmlFormId if the form does not have a name', () => {
      testData.extendedAudits.createPast(1, {
        actor: testData.extendedUsers.first(),
        action: 'form.create',
        actee: testData.standardForms.createPast(1, { name: null }).last()
      });
      mountComponent().get('.target a').text().should.equal('f');
    });

    it('links to .../draft for a form without a published version', () => {
      testData.extendedAudits.createPast(1, {
        actor: testData.extendedUsers.first(),
        action: 'form.create',
        actee: testData.standardForms
          .createPast(1, { xmlFormId: 'a b', draft: true })
          .last()
      });
      const row = mountComponent();
      const link = row.findAllComponents(RouterLinkStub).find(wrapper =>
        wrapper.element.closest('.target') != null);
      link.props().to.should.equal('/projects/1/forms/a%20b/draft');
    });
  });

  describe('public link target', () => {
    const cases = [
      ['public_link.create', ['Public Access Link', 'Create']],
      ['public_link.assignment.create', ['Public Access Link', 'Give Access']],
      ['public_link.assignment.delete', ['Public Access Link', 'Remove Access']],
      ['public_link.session.end', ['Public Access Link', 'Revoke']],
      ['public_link.delete', ['Public Access Link', 'Delete']]
    ];

    for (const [action, type] of cases) {
      it(`renders a ${action} audit correctly`, () => {
        testData.extendedAudits.createPast(1, {
          actor: testData.extendedUsers.first(),
          action,
          actee: testData.toActor(testData.standardPublicLinks
            .createPast(1, { displayName: 'My Public Link' })
            .last())
        });
        const row = mountComponent();
        testType(row, type);
        testTarget(row, 'My Public Link');
      });
    }

    it('renders deleted public link targets correctly', () => {
      const deletedActor = testData.toActor(testData.standardPublicLinks
        .createPast(1, { displayName: 'My Public Link' })
        .last());
      deletedActor.deletedAt = ago({ days: 2 }).toISO();
      testData.extendedAudits.createPast(1, {
        actor: testData.extendedUsers.first(),
        action: 'public_link.delete', // will display the same way for all actions
        actee: deletedActor
      });
      const target = mountComponent().get('.target');
      target.find('a').exists().should.be.false();
      target.text().should.equal('My Public Link');
      const icon = target.find('.icon-trash');
      icon.exists().should.be.true();
      icon.attributes().title.should.equal('This resource has been deleted.');
    });
  });

  describe('dataset target', () => {
    const cases = [
      ['dataset.create', ['Dataset', 'Create']],
      ['dataset.update', ['Dataset', 'Update']]
    ];

    for (const [action, type] of cases) {
      it(`renders a ${action} audit correctly`, () => {
        testData.extendedAudits.createPast(1, {
          actor: testData.extendedUsers.first(),
          action,
          actee: testData.extendedDatasets
            .createPast(1, { name: 'people' })
            .last()
        });
        const row = mountComponent();
        testType(row, type);
        testTarget(row, 'people');
      });
    }
  });

  describe('app user target', () => {
    const cases = [
      ['field_key.create', ['App User', 'Create']],
      ['field_key.assignment.create', ['App User', 'Give Access']],
      ['field_key.assignment.delete', ['App User', 'Remove Access']],
      ['field_key.session.end', ['App User', 'Revoke']],
      ['field_key.delete', ['App User', 'Delete']]
    ];

    for (const [action, type] of cases) {
      it(`renders a ${action} audit correctly`, () => {
        testData.extendedAudits.createPast(1, {
          actor: testData.extendedUsers.first(),
          action,
          actee: testData.toActor(testData.extendedFieldKeys
            .createPast(1, { displayName: 'My App User' })
            .last())
        });
        const row = mountComponent();
        testType(row, type);
        testTarget(row, 'My App User');
      });
    }

    it('renders deleted app user targets correctly', () => {
      const deletedActor = testData.toActor(testData.extendedFieldKeys
        .createPast(1, { displayName: 'My App User' })
        .last());
      deletedActor.deletedAt = ago({ days: 2 }).toISO();
      testData.extendedAudits.createPast(1, {
        actor: testData.extendedUsers.first(),
        action: 'field_key.delete', // will display the same way for all actions
        actee: deletedActor
      });
      const target = mountComponent().get('.target');
      target.find('a').exists().should.be.false();
      target.text().should.equal('My App User');
      const icon = target.find('.icon-trash');
      icon.exists().should.be.true();
      icon.attributes().title.should.equal('This resource has been deleted.');
    });
  });

  it('renders a config.set audit correctly', () => {
    testData.extendedAudits.createPast(1, { action: 'config.set' });
    const row = mountComponent();
    testType(row, ['Server Configuration', 'Set']);
    testTarget(row, '');
  });

  it('renders a backup audit correctly', () => {
    testData.standardConfigs.createPast(1, {
      key: 'backups',
      value: { type: 'google' },
      setAt: ago({ days: 2 }).toISO()
    });
    testData.standardAudits.createBackupAudit({
      success: true,
      loggedAt: ago({ days: 1 }).toISO()
    });
    const row = mountComponent();
    testType(row, ['Backup']);
    testTarget(row, '');
  });

  it('renders an analytics audit correctly', () => {
    testData.extendedAudits.createPast(1, { action: 'analytics' });
    const row = mountComponent();
    testType(row, ['Report Usage']);
    testTarget(row, '');
  });

  it('renders an audit with an unknown action correctly', () => {
    testData.extendedAudits.createPast(1, {
      action: 'unknown',
      actee: testData.toActor(testData.extendedUsers
        .createPast(1, { displayName: 'User 2' })
        .last())
    });
    testType(mountComponent(), ['unknown']);
  });

  it('renders an audit with an unknown category correctly', () => {
    testData.extendedAudits.createPast(1, {
      action: 'something.unknown',
      actee: testData.toActor(testData.extendedUsers
        .createPast(1, { displayName: 'User 2' })
        .last())
    });
    testType(mountComponent(), ['something.unknown']);
  });

  it('renders an audit with an unknown action for its category', () => {
    testData.extendedAudits.createPast(1, {
      action: 'project.unknown',
      actee: testData.standardProjects
        .createPast(1, { name: 'My Project' })
        .last()
    });
    const row = mountComponent();
    testType(row, ['project.unknown']);
    testTarget(row, 'My Project', '/projects/1');
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
      const actorLink = mountComponent().getComponent(ActorLink);
      actorLink.props().actor.displayName.should.equal('User 1');
    });

    it('renders correctly for an audit with a deleted actor', () => {
      testData.extendedAudits.createPast(1, {
        actor: testData.extendedUsers
          .createPast(1, {
            displayName: 'Deleted User',
            deletedAt: new Date().toISOString()
          })
          .last(),
        action: 'user.update',
        actee: testData.toActor(testData.extendedUsers.first())
      });
      const row = mountComponent();
      row.findComponent(ActorLink).exists().should.be.true();
      const icon = row.get('.initiator .icon-trash');
      icon.attributes().title.should.equal('This resource has been deleted.');
    });

    it('renders correctly for an audit without an actor', () => {
      testData.extendedAudits.createPast(1, {
        action: 'upgrade.process.form',
        actee: testData.standardForms
          .createPast(1, { name: 'My Form' })
          .last()
      });
      mountComponent().get('.initiator').text().should.equal('');
    });
  });

  it('renders the details correctly', () => {
    testData.extendedAudits.createPast(1, {
      actor: testData.extendedUsers.first(),
      action: 'user.update',
      actee: testData.toActor(testData.extendedUsers.first()),
      details: { some: 'json' }
    });
    const selectable = mountComponent().getComponent(Selectable);
    selectable.text().should.equal('{"some":"json"}');
  });

  it('renders a purged form row correctly', () => {
    testData.extendedAudits.createPast(1, {
      actor: testData.extendedUsers.first(),
      action: 'form.purge',
      actee: {
        purgedAt: ago({ days: 2 }).toISO(),
        purgedName: 'Purged Form',
        details: { formId: 123 }
      },
      details: { some: 'json' }
    });
    const target = mountComponent().get('.target');
    target.find('a').exists().should.be.false();
    target.text().should.equal('Purged Form');
    const icon = target.find('.icon-trash');
    icon.exists().should.be.true();
    icon.attributes().title.should.equal('This resource has been purged.');
    // The purged details aren't part of the audit and don't show up here
    // but the original details of the audit do
    const selectable = mountComponent().getComponent(Selectable);
    selectable.text().should.equal('{"some":"json"}');
  });
});
