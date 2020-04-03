/*
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Audit from '../../../presenters/audit';
import FieldKey from '../../../presenters/field-key';
import Form from '../../../presenters/form';
import FormAttachment from '../../../presenters/form-attachment';
import Option from '../../../util/option';
import Project from '../../../presenters/project';
import User from '../../../presenters/user';

// Each type of response data that the `request` module manages is associated
// with a key. Each key tends to correspond to a single Backend endpoint.
export const keys = [
  'session',
  'currentUser',

  'users',
  'user',

  'roles',
  // Actors associated with sitewide assignments
  'actors',

  'projects',
  'project',
  'projectAssignments',
  'forms',
  'formSummaryAssignments',
  'form',
  // Fields for a single form version (the primary version or otherwise)
  'fields',
  'formActors',
  'formVersions',
  'formDraft',
  // Form draft attachments
  'attachments',
  // A single chunk of submissions OData for a single form version
  'submissionsChunk',
  // Encryption keys for a single form version
  'keys',
  'fieldKeys',

  'backupsConfig',
  'audits'
];

// Define functions to transform responses.
const optional = (transform = undefined) => (response) => (response.status === 200
  ? Option.of(transform != null ? transform(response) : response.data)
  : Option.none());
export const transforms = {
  currentUser: ({ data }) => new User(data),

  users: ({ data }) => data.map(user => new User(user)),
  user: ({ data }) => new User(data),

  projects: ({ data }) => data.map(project => new Project(project)),
  project: ({ data }) => new Project(data),
  forms: ({ data }) => data.map(form => new Form(form)),
  form: ({ data }) => new Form(data),
  formVersions: ({ data }) => data.map(version => new Form(version)),
  formDraft: optional(({ data }) => new Form(data)),
  attachments: optional(({ data }) =>
    data.map(attachment => new FormAttachment(attachment))),
  fieldKeys: ({ data }) => data.map(fieldKey => new FieldKey(fieldKey)),

  backupsConfig: optional(),
  audits: ({ data }) => data.map(audit => new Audit(audit))
};

const dataGetters = {
  loggedIn: ({ data: { session } }) => session != null && session.token != null,
  loggedOut: (state, getters) => !getters.loggedIn,

  projectRoles: ({ data: { roles } }) => {
    if (roles == null) return null;
    return [
      roles.find(role => role.system === 'manager'),
      roles.find(role => role.system === 'viewer')
    ];
  },

  missingAttachmentCount: ({ data: { attachments } }) => {
    if (attachments == null) return null;
    if (attachments.isEmpty()) return 0;
    return attachments.get().reduce(
      (count, attachment) => (attachment.exists ? count : count + 1),
      0
    );
  },
  fieldKeysWithToken: ({ data: { fieldKeys } }) => (fieldKeys != null
    ? fieldKeys.filter(fieldKey => fieldKey.token != null)
    : null),

  // Returns the backup attempts for the current backups config.
  auditsForBackupsConfig: ({ data: { audits, backupsConfig } }) => {
    if (audits == null || backupsConfig == null) return null;
    if (backupsConfig.isEmpty()) return [];

    const result = [];
    for (const audit of audits) {
      if (audit.loggedAt < backupsConfig.get().setAt) {
        // Any backup attempts that follow are for a previous config: `audits`
        // is sorted descending by loggedAt.
        break;
      }
      // eslint-disable-next-line no-continue
      if (audit.action !== 'backup') continue;

      const { details } = audit;
      /* This will evaluate to `false` only if an attempt for a previous config
      was logged after the current config was created, which seems unlikely. A
      failed attempt might not have a configSetAt property, which means that if
      a failed attempt was logged after the current config was created, we might
      not be able to determine whether the attempt corresponds to the current
      config or (again unlikely) to a previous one. We assume that an attempt
      without a configSetAt property corresponds to the current config. */
      if (details.configSetAt === backupsConfig.get().setAt ||
        details.configSetAt == null)
        result.push(audit);
    }
    return result;
  }
};
export const getters = dataGetters;
