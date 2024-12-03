/*
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

// The HoverCards component only uses local resources. This composable creates
// those resources. In some cases, we shadow the names of app-wide resources,
// e.g., `form`. For simplicity, we want the hover card resources to be
// independent of resources used in other components.

import useSubmission from './submission';
import { transformForm } from './util';
import { useRequestData } from './index';

export default () => {
  const { createResource } = useRequestData();
  const { submission } = useSubmission();
  return {
    form: createResource('form', () => ({
      transformResponse: ({ data }) => transformForm(data)
    })),
    submission,
    dataset: createResource('dataset'),
    entity: createResource('entity')
  };
};
