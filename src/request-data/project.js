/*
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { computed, watchSyncEffect } from 'vue';

import { computeIfExists, transformForms } from './util';
import { useRequestData } from './index';

export default () => {
  const { project, createResource, createGetter } = useRequestData();
  const projectAssignments = createResource('projectAssignments');
  const forms = createResource('forms', () => ({
    transformResponse: transformForms
  }));
  const deletedForms = createResource('deletedForms', () => ({
    transformResponse: transformForms
  }));
  const formSummaryAssignments = createResource('formSummaryAssignments');
  const fieldKeys = createResource('fieldKeys', () => ({
    withToken: computeIfExists(() =>
      fieldKeys.filter(fieldKey => fieldKey.token != null))
  }));

  watchSyncEffect(() => {
    if (project.dataExists && forms.dataExists &&
      project.forms !== forms.length)
      project.forms = forms.length;
  });
  watchSyncEffect(() => {
    if (project.dataExists && fieldKeys.dataExists &&
      project.appUsers !== fieldKeys.length)
      project.appUsers = fieldKeys.length;
  });

  // Returns a set containing just the form names that appear more than once
  // in a project. Used on project overview to show form ID next to form name
  // when form names are duplicated.
  const duplicateFormNames = createGetter('duplicateFormNames', computed(() => {
    if (!(forms.dataExists && deletedForms.dataExists)) return null;
    const allForms = [...forms, ...deletedForms];
    const seenNames = new Set();
    const dupeNames = new Set();
    for (const form of allForms) {
      const formName = form.nameOrId.toLocaleLowerCase();
      if (seenNames.has(formName)) dupeNames.add(formName);
      seenNames.add(formName);
    }
    return dupeNames;
  }));

  return {
    project, projectAssignments, forms, deletedForms, formSummaryAssignments,
    fieldKeys, duplicateFormNames
  };
};
