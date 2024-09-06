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
import { computed, reactive, shallowReactive, watchSyncEffect } from 'vue';
import { mergeDeepLeft } from 'ramda';

import configDefaults from '../config';
import { computeIfExists, hasVerbs, setupOption, transformForm } from './util';
import { noargs } from '../util/util';
import { apiPaths, withAuth } from '../util/request';
import { _container } from './resource';

export default ({ i18n }, createResource) => {
  // Resources related to the session
  createResource('session');
  createResource('currentUser', () => ({
    /* eslint-disable no-param-reassign */
    transformResponse: ({ data }) => {
      data.verbs = new Set(data.verbs);
      data.can = hasVerbs;
      return shallowReactive(data);
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

  createResource('userPreferences', (self) => ({
    _container,
    abortControllers: {},
    instanceID: crypto.randomUUID(),
    transformResponse: ({ data }) => shallowReactive(data),
    patchServerside: (k, v) => {
      // As we need to be able to have multiple requests in-flight, we can't use resource.request() here.
      // However, we want to avoid stacking requests for the same key, so we abort preceding requests for the same key, if any.
      // Note that because locks are origin-scoped, we use a store instantiation identifier to scope them to this app instance.
      const keyLockName = `userPreferences-${self.instanceID}-keystack-${k}`;
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
                self.abortControllers[k].abort();
                return navigator.locks.request(
                  keyLockName,
                  () => {
                    // eslint-disable-next-line no-param-reassign
                    self.abortControllers[k] = aborter;
                    return self.requestPatchServerside(k, v, aborter);
                  }
                );
              }
              // eslint-disable-next-line no-param-reassign
              self.abortControllers[k] = aborter;
              return self.requestPatchServerside(k, v, aborter);
            },
          );
          return Promise.resolve(); // return asap with a resolved promise so the outer lockops lock gets released; we don't wan't to wait here for the inner keylock-enveloped requests.
        }
      );
    },
    requestPatchServerside: (k, v, aborter) => {
      const { requestData, http } = self[self._container];
      return http.request(
        withAuth(
          {
            method: 'PATCH',
            url: apiPaths.userPreferences(),
            headers: {
              'Content-Type': 'application/json',
              'X-Extended-Metadata': 'true',
            },
            data: Object.fromEntries(new Map([[k, v]])),
            signal: aborter.signal,
          },
          requestData.session.token
        )
      );
    },
    set: (k, v, propagate = true) => {
      // eslint-disable-next-line no-param-reassign
      self[k] = v;
      if (propagate) return self.patchServerside(k, v);
      return null;
    },
    mutateSet: (k, v, op) => {
      const prefSet = new Set(self.data[k] instanceof Array ? self.data[k] : []); // ignore/overwrite set-incompatible data (as may have been left behind by an older version with a different implicit preferences schema)
      switch (op) {
        case 'add':
          prefSet.add(v);
          break;
        case 'delete':
          prefSet.delete(v);
          break;
        default:
          throw new Error(`Unsupported set operation: "${op}"`);
      }
      self.set(k, Array.from(prefSet).sort());
    },
    addToSet: (k, v) => self.mutateSet(k, v, 'add'),
    deleteFromSet: (k, v) => self.mutateSet(k, v, 'delete'),
    fetchOnce: () => {
      if (!self.dataExists) self.request({
        url: apiPaths.userPreferences(),
        resend: false,
      });
    },
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
