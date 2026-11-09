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
import { computeIfExists, hasVerbs, transformForm } from './util';
import { useRequestData } from './index';

export default () => {
  const { createResource } = useRequestData();
  return createResource('projects', (projects) => ({
    /* eslint-disable no-param-reassign */
    transformResponse: ({ data }) => {
      for (const project of data) {
        for (const form of project.formList)
          transformForm(form);
        project.verbs = new Set(project.verbs);
        project.permits = hasVerbs;
      }
      return data;
    },
    /* eslint-enable no-param-reassign */
    // Returns an object of Sets containing duplicate project names for use
    // by the Project list page.
    duplicateFormNamesPerProject: computeIfExists(() => {
      const dupeNamesByProject = {};
      for (const project of projects) {
        const seenNames = new Set();
        dupeNamesByProject[project.id] = new Set();
        for (const form of project.formList) {
          const formName = form.nameOrId.toLocaleLowerCase();
          if (seenNames.has(formName)) dupeNamesByProject[project.id].add(formName);
          seenNames.add(formName);
        }
      }
      return dupeNamesByProject;
    })
  }));
};
