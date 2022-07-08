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
import { computed } from 'vue';

export default (store) => ({
  // Returns an object of Sets containing duplicate project names for use
  // by the Project list page.
  duplicateFormNamesPerProject: computed(() => {
    const { projects } = store.state.request.data;
    if (projects == null) return {};
    const dupeNamesByProject = {};
    for (const project of projects) {
      const seenNames = new Set();
      dupeNamesByProject[project.id] = new Set();
      for (const form of project.formList) {
        const formName = form.nameOrId().toLocaleLowerCase();
        if (seenNames.has(formName)) dupeNamesByProject[project.id].add(formName);
        seenNames.add(formName);
      }
    }
    return dupeNamesByProject;
  }),
  // Returns a set containing just the form names that appear more than once
  // in a project. Used on project overview to show form ID next to form name
  // when form names are duplicated.
  duplicateFormNames: computed(() => {
    const { forms, deletedForms } = store.state.request.data;
    const allForms = [...forms || [], ...deletedForms || []];
    const seenNames = new Set();
    const dupeNames = new Set();
    for (const form of allForms) {
      const formName = form.nameOrId().toLocaleLowerCase();
      if (seenNames.has(formName)) dupeNames.add(formName);
      seenNames.add(formName);
    }
    return dupeNames;
  })
});
