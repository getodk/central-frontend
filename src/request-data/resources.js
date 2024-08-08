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
import { computed, reactive, shallowReactive, watchSyncEffect, isReactive } from 'vue';
import { mergeDeepLeft } from 'ramda';

import configDefaults from '../config';
import { computeIfExists, hasVerbs, setupOption, transformForm } from './util';
import { noargs } from '../util/util';
import { apiPaths, withAuth } from '../util/request';
import { _container } from './resource';

export default ({ i18n }, createResource) => {
  // Resources related to the session
  createResource('session');
  createResource('currentUser', (self) => ({
    /* eslint-disable no-param-reassign */
    transformResponse: ({ data }) => {
      data.verbs = new Set(data.verbs);
      data.can = hasVerbs;
      data.preferences = {
        site: new Proxy(
          shallowReactive(data.preferences.site),
          {
            deleteProperty(target, prop) {
              const retval = (delete target[prop]);
              self.preferenceOps.propagate(prop, null, null); // DELETE to backend
              return retval;
            },
            set(target, prop, value) {
              // eslint-disable-next-line no-multi-assign
              const retval = (target[prop] = value);
              self.preferenceOps.propagate(prop, value, null); // PUT to backend
              return retval;
            },
          },
        ),
        projects: new Proxy(
          data.preferences.projects,
          {
            deleteProperty() {
              throw new Error('Deleting a project\'s whole property collection is not supported. Delete each property individually, eg "delete preferences.projects[3].foo".');
            },
            set() {
              throw new Error('Directly setting a project\'s whole property collection is not supported. Set each property individually, eg "preferences.projects[3].foo = \'bar\'"');
            },
            get(target, projectId) {
              if (Number.isNaN(parseInt(projectId, 10))) throw new TypeError(`Not an integer project ID: "${projectId}"`);
              const projectProps = target[projectId];
              if (projectProps === undefined || (!isReactive(projectProps))) { // not reentrant (TOCTOU issue) but there's no real way to solve it — as this is supposed to be a synchronous method we can't simply wrap it in a Lock
                target[projectId] = new Proxy(
                  // make (potentially autovivicated) props reactive, and front them with a proxy to enable our setters/deleters
                  shallowReactive(projectProps === undefined ? {} : projectProps),
                  {
                    deleteProperty(from, prop) {
                      const retval = (delete from[prop]);
                      self.preferenceOps.propagate(prop, null, projectId); // DELETE to backend
                      return retval;
                    },
                    set(from, prop, propval) {
                      // eslint-disable-next-line no-multi-assign
                      const retval = (from[prop] = propval);
                      self.preferenceOps.propagate(prop, propval, projectId); // PUT to backend
                      return retval;
                    },
                  }
                );
              }
              return target[projectId];
            },
          }
        ),
      };
      return shallowReactive(data);
    },
    preferenceOps: {
      self,
      _container,
      abortControllers: {},
      instanceID: crypto.randomUUID(),
      propagate: (k, v, projectId) => {
        // As we need to be able to have multiple requests in-flight (not canceling eachother), we can't use resource.request() here.
        // However, we want to avoid stacking requests for the same key, so we abort preceding requests for the same key, if any.
        // Note that because locks are origin-scoped, we use a store instantiation identifier to scope them to this app instance.
        const keyLockName = `userPreferences-${self.instanceID}-keystack-${projectId}-${k}`;
        navigator.locks.request(
          `userPreferences-${self.instanceID}-lockops`,
          () => {
            navigator.locks.request(
              keyLockName,
              { ifAvailable: true },
              (lockForKey) => {
                const aborter = new AbortController();
                if (!lockForKey) {
                  // Cancel the preceding request, a new one supersedes it.
                  self.preferenceOps.abortControllers[k].abort();
                  return navigator.locks.request(
                    keyLockName,
                    () => {
                      self.preferenceOps.abortControllers[k] = aborter;
                      return self.preferenceOps.request(k, v, projectId, aborter);
                    }
                  );
                }
                self.preferenceOps.abortControllers[k] = aborter;
                return self.preferenceOps.request(k, v, projectId, aborter);
              },
            );
            return Promise.resolve(); // return asap with a resolved promise so the outer lockops lock gets released; we don't wan't to wait here for the inner keylock-enveloped requests.
          }
        );
      },
      request: (k, v, projectId, aborter) => {
        const { requestData, http } = self[self.preferenceOps._container];
        return http.request(
          withAuth(
            {
              method: (v === null) ? 'DELETE' : 'PUT',
              url: (projectId === null) ? `${apiPaths.userSitePreferences(k)}` : `${apiPaths.userProjectPreferences(projectId, k)}`,
              headers: {
                'Content-Type': 'application/json',
              },
              data: (v === null) ? undefined : { propertyValue: v },
              signal: aborter.signal,
            },
            requestData.session.token
          )
        );
      },
    }
    /* eslint-enable no-param-reassign */
  }));

  // Resources related to the system
  createResource('config', (config) => ({
    // If client-config.json is completely invalid JSON, `data` seems to be a
    // string (e.g., '{]').
    transformResponse: ({ data }) => (typeof data === 'object' && data != null
      ? mergeDeepLeft(data, configDefaults)
      : configDefaults),
    loaded: computed(() => config.dataExists && config.loadError == null)
  }));
  createResource('centralVersion');
  createResource('analyticsConfig', noargs(setupOption));
  createResource('roles', (roles) => ({
    bySystem: computeIfExists(() => {
      // Using Object.create(null) in case there is a role whose `system`
      // property is '__proto__'.
      const bySystem = Object.create(null);
      for (const role of roles)
        bySystem[role.system] = role;
      return bySystem;
    }),
    projectRoles: computeIfExists(() => {
      const { bySystem } = roles;
      // If you add a new role, make sure to also add a new i18n message.
      return [bySystem.manager, bySystem.viewer, bySystem.formfill];
    })
  }));

  // Projects and subresources
  createResource('project', (project) => ({
    /* eslint-disable no-param-reassign */
    transformResponse: ({ data }) => {
      data.verbs = new Set(data.verbs);
      data.permits = hasVerbs;
      return shallowReactive(data);
    },
    /* eslint-enable no-param-reassign */
    nameWithArchived: computeIfExists(() => (project.archived
      ? i18n.t('requestData.project.nameWithArchived', project)
      : project.name))
  }));
  createResource('form', () => ({
    transformResponse: ({ data }) => shallowReactive(transformForm(data))
  }));

  createResource('dataset', () => ({
    transformResponse: ({ data }) => shallowReactive(data)
  }));

  const formDraft = createResource('formDraft', () =>
    setupOption(data => shallowReactive(transformForm(data))));

  // Form draft attachments
  const attachments = createResource('attachments', () => ({
    ...setupOption((data) => data.reduce(
      (map, attachment) => map.set(attachment.name, reactive(attachment)),
      new Map()
    )),
    missingCount: computeIfExists(() => {
      if (attachments.isEmpty()) return 0;
      let count = 0;
      for (const attachment of attachments.get().values()) {
        if (!attachment.exists) count += 1;
      }
      return count;
    })
  }));
  watchSyncEffect(() => {
    if (formDraft.dataExists && attachments.dataExists) {
      if (formDraft.isDefined() && attachments.isEmpty())
        formDraft.setToNone();
      else if (formDraft.isEmpty() && attachments.isDefined())
        attachments.setToNone();
    }
  });
};
