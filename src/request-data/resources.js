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
import { computed, shallowReactive } from 'vue';
import { mergeDeepLeft } from 'ramda';

import UserPreferences from './user-preferences/preferences';
import configDefaults from '../config';
import { computeIfExists, hasVerbs, setupOption, transformForm } from './util';
import { noargs } from '../util/util';

export default (container, createResource) => {
  const { i18n } = container;

  // Resources related to the session
  createResource('session');
  createResource('currentUser', () => ({
    transformResponse: ({ data }) => {
      /* eslint-disable no-param-reassign */
      data.verbs = new Set(data.verbs);
      data.can = hasVerbs;
      data.preferences = new UserPreferences(data.preferences, container);
      /* eslint-enable no-param-reassign */
      return shallowReactive(data);
    }
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
  createResource('centralVersion', () => ({
    transformResponse: ({ data, headers }) =>
      shallowReactive({
        versionText: data,
        currentVersion: data.match(/\(v(\d{4}[^-]*)/)[1],
        currentDate: new Date(headers.get('date'))
      })
  }));
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
  createResource('dataset', (dataset) => ({
    transformResponse: ({ data }) => {
      // Add projectId to forms. FormLink expects this property to exist on form
      // objects.
      const { projectId } = data;
      for (const form of data.sourceForms) form.projectId = projectId;
      for (const form of data.linkedForms) form.projectId = projectId;
      for (const property of data.properties) {
        for (const form of property.forms) form.projectId = projectId;
      }

      return shallowReactive(data);
    },
    hasGeometry: computeIfExists(() =>
      dataset.properties.some(({ name }) => name === 'geometry'))
  }));
};
