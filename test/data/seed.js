import { standardRoles } from './roles';

export default () => {
  // Only creating roles that we currently use in Frontend.
  standardRoles
    .createPast(1, {
      name: 'Administrator',
      system: 'admin',
      // This is not the full list of verbs used in Backend, but it should be
      // the full list used in Frontend.
      verbs: [
        'analytics.read',
        'assignment.create',
        'assignment.list',
        'assignment.delete',
        'audit.read',
        'backup.run',
        'config.read',
        'config.set',
        'dataset.list',
        'entity.list',
        'field_key.create',
        'field_key.list',
        'form.create',
        'form.list',
        'form.read',
        'form.update',
        'form.delete',
        'form.restore',
        'project.create',
        'project.update',
        'public_link.create',
        'public_link.list',
        'session.end',
        'submission.create',
        'submission.list',
        'submission.read',
        'submission.update',
        'user.create',
        'user.list',
        'user.read',
        'user.update',
        'user.delete',
        'user.password.invalidate'
      ]
    })
    .createPast(1, {
      name: 'App User',
      system: 'app-user',
      verbs: [
        'form.read',
        'submission.create'
      ]
    })
    .createPast(1, {
      name: 'Project Manager',
      system: 'manager',
      verbs: [
        'assignment.create',
        'assignment.list',
        'assignment.delete',
        'dataset.list',
        'entity.list',
        'field_key.create',
        'field_key.list',
        'form.create',
        'form.list',
        'form.read',
        'form.update',
        'form.delete',
        'form.restore',
        'project.update',
        'public_link.create',
        'public_link.list',
        'session.end',
        'submission.create',
        'submission.list',
        'submission.read',
        'submission.update'
      ]
    })
    .createPast(1, {
      name: 'Project Viewer',
      system: 'viewer',
      verbs: [
        'dataset.list',
        'entity.list',
        'form.list',
        'form.read',
        'submission.list',
        'submission.read'
      ]
    })
    .createPast(1, {
      name: 'Data Collector',
      system: 'formfill',
      verbs: [
        'form.list',
        'form.read',
        'submission.create'
      ]
    });
};
