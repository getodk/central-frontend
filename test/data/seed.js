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
        'dataset.create',
        'dataset.list',
        'dataset.read',
        'dataset.update',
        'entity.create',
        'entity.list',
        'entity.read',
        'entity.update',
        'entity.delete',
        'entity.restore',
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
        'submission.delete',
        'submission.restore',
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
        'dataset.create',
        'dataset.list',
        'dataset.read',
        'dataset.update',
        'entity.create',
        'entity.list',
        'entity.read',
        'entity.update',
        'entity.delete',
        'entity.restore',
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
        'submission.update',
        'submission.delete',
        'submission.restore'
      ]
    })
    .createPast(1, {
      name: 'Project Viewer',
      system: 'viewer',
      verbs: [
        'dataset.list',
        'dataset.read',
        'entity.list',
        'entity.read',
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
        'project.read',
        'open_form.list',
        'open_form.read',
        'submission.create'
      ]
    });
};
