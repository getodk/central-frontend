/*
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { construct, identity, last } from 'ramda';
import { computed, reactive } from 'vue';

import Field from '../presenters/field';
import Form from '../presenters/form';
import Option from '../util/option';
import Project from '../presenters/project';
import User from '../presenters/user';
import createResourceForContainer from './resource';
import { computeIfExists } from '../util/reactivity';



////////////////////////////////////////////////////////////////////////////////
// DEBUGGER

// Set to `true` to log whenever a request is sent or data is modified.
const debug = false;

let resourceDebugger;
let withDebugging = identity;

if (debug) {
  const stack = [];

  withDebugging = (resources) => {
    const debuggableResources = {};
    for (const [resourceKey, resource] of Object.entries(resources)) {
      const debuggableResource = Object.create(resource);
      for (const prop in resource) { // eslint-disable-line guard-for-in
        const value = resource[prop];
        if (typeof value === 'function' && value !== Object.prototype[prop]) {
          // eslint-disable-next-line func-names
          debuggableResource[prop] = function(...args) {
            stack.push([resourceKey, prop]);
            let result;
            try {
              result = value.apply(this, args);
            } finally {
              stack.pop();
            }
            return result;
          };
        }
      }
      debuggableResources[resourceKey] = debuggableResource;
    }
    return debuggableResources;
  };

  resourceDebugger = (...args) => {
    const [resourceKey, methodName] = last(stack);
    // eslint-disable-next-line no-console
    console.log(`requestData.${resourceKey}.${methodName}()`, ...args);
  };
}



////////////////////////////////////////////////////////////////////////////////
// RESOURCE TYPES

/* eslint-disable no-param-reassign */

const presenterResource = (klass) => (data) => ({
  // eslint-disable-next-line new-cap
  transformResponse: (response) => new klass(response.data),
  update: (updates) => { data.value = data.value.with(updates); }
});

const optionResource = (data) => ({
  transformResponse: (response) => (response.status !== 404
    ? Option.of(response.data)
    : Option.none()),
  setToNone() { data.value = Option.none(); },

  request(config) {
    const configWithDefaults = config.fulfillProblem != null
      ? config
      : { ...config, fulfillProblem: ({ code }) => code === 404.1 };
    return super.request(configWithDefaults);
  }
});

/* eslint-enable no-param-reassign */



////////////////////////////////////////////////////////////////////////////////
// RESOURCES

export default (container, requestData) => {
  const createResource = createResourceForContainer(container, resourceDebugger);
return withDebugging({
  /* eslint-disable no-param-reassign */

  centralVersion: createResource(),
  session: createResource(),
  currentUser: createResource(presenterResource(User)),

  users: createResource(() => ({
    transformResponse: (response) => response.data.map(construct(User))
  })),

  user: createResource(presenterResource(User)),

  roles: createResource(data => {
    const transformResponse = (response) => response.data.reduce(
      (map, role) => map.set(role.id, role),
      new Map()
    );
    const bySystem = computeIfExists(data, (value) => {
      const map = new Map();
      for (const role of value.values())
        map.set(role.system, role);
      return map;
    });
    const projectRoles = computeIfExists(bySystem, (value) =>
      [value.get('manager'), value.get('viewer'), value.get('formfill')]);
    return { transformResponse, bySystem, projectRoles };
  }),

  // Actors with a sitewide assignment
  actors: createResource(() => ({
    transformResponse: (response) => response.data.reduce(
      (map, actor) => map.set(actor.id, actor),
      new Map()
    )
  })),

  projects: createResource(() => ({
    transformResponse: (response) => response.data.map(construct(Project))
  })),

  project: createResource(() => ({
    transformResponse: (response) => new Project(response.data)
  })),

  projectAssignments: createResource(data => ({
    transformResponse: (response) => reactive(response.data.reduce(
      (map, assignment) => map.set(assignment.actor.id, assignment),
      new Map()
    )),
    assign: (actor, roleId) => {
      const assignment = data.value.get(actor.id);
      if (assignment != null)
        assignment.roleId = roleId;
      else
        data.value.set(actor.id, { actor, roleId });
    },
    revoke: (actorId) => {
      data.value.get(actorId).roleId = null;
    }
  })),

  forms: createResource(() => ({
    transformResponse: (response) => response.data.map(construct(Form))
  })),

  formSummaryAssignments: createResource(),
  form: createResource(presenterResource(Form), (data) => ({
    update: (updates) => { data.value = data.value.with(updates); }
  })),

  // The fields for a particular form version, whether the primary version or
  // otherwise
  fields: createResource(data => ({
    transformResponse: (response) => response.data.map(construct(Field)),

    binaryPaths: computeIfExists(data, (value) => value.reduce(
      (acc, cur) => (cur.binary ? acc.add(cur.path) : acc),
      new Set()
    )),
    selectable: computeIfExists(data, (value) => {
      const selectable = [];
      // The path of the top-level repeat group currently being traversed
      let repeat = null;
      for (const field of value) {
        const { path } = field;
        if (repeat == null || !path.startsWith(repeat)) {
          repeat = null;
          // Note that `type` may be `undefined`, though I have seen this only in
          // the Widgets sample form (<branch>):
          // https://github.com/getodk/sample-forms/blob/e9fe5838e106b04bf69f43a8a791327093571443/Widgets.xml
          const { type } = field;
          if (type === 'repeat') {
            repeat = `${path}/`;
          } else if (type !== 'structure' && path !== '/meta/instanceID' &&
            path !== '/instanceID') {
            selectable.push(field);
          }
        }
      }
      return selectable;
    })
  })),

  formVersions: createResource(() => ({
    transformResponse: (response) => response.data.map(construct(Form))
  })),

  formVersionXml: createResource(),

  formDraft: createResource(optionResource, (data) => ({
    transformResponse(response) {
      return super.transformResponse(response).map(construct(Form));
    },
    update: (updates) => {
      data.value = Option.of(data.value.get().with(updates));
    }
  })),

  // Form draft attachments
  attachments: createResource(optionResource, (data) => ({
    transformResponse(response) {
      return super.transformResponse(response)
        .map(responseData => responseData.reduce(
          (map, attachment) => map.set(attachment.name, reactive(attachment)),
          new Map()
        ));
    },
    updateOne: (name, updates) => {
      Object.assign(data.value.get().get(name), updates);
    },

    missingCount: computeIfExists(data, (value) => {
      if (value.isEmpty()) return 0;
      let count = 0;
      for (const attachment of value.values()) {
        if (attachment.exists) count += 1;
      }
      return count;
    })
  })),

  // A single chunk of submissions OData for a particular form version
  odataChunk: createResource(() => ({
    transformResponse: (response) => {
      const url = new URL(response.config.url, window.location.origin);
      return { ...response.data, filtered: url.searchParams.has('$filter') };
    }
  })),

  // Encryption keys for a particular form version
  keys: createResource(data => ({
    managedKey: computeIfExists(data, (value) => value.find(key => key.managed))
  })),

  submitters: createResource(),

  submission: createResource(data => ({
    transformResponse: (response) => {
      const value = response.data.value[0];
      value.__system = reactive(value.__system);
      return value;
    },
    review: (reviewState) => { data.value.__system.reviewState = reviewState; }
  })),

  comments: createResource(),
  diffs: createResource(),
  publicLinks: createResource(),

  fieldKeys: createResource(data => ({
    withToken: computeIfExists(data, (value) =>
      value.filter(fieldKey => fieldKey.token != null))
  })),

  backupsConfig: createResource(optionResource),
  analyticsConfig: createResource(optionResource),

  audits: createResource(data => ({
    // Returns the backup attempts for the current backups config.
    forBackupsConfig: computed(() => {
      const backupsConfig = requestData.backupsConfig.data;
      if (data.value == null || backupsConfig == null) return null;
      if (backupsConfig.isEmpty()) return [];

      const result = [];
      for (const audit of data.value) {
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
    })
  }))

  /* eslint-enable no-param-reassign */
});
};
