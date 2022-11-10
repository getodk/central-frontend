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
import { transformForms } from './util';
import { useRequestData } from './index';

export default () => {
  const { form, formDraft, attachments, createResource } = useRequestData();
  const formVersions = createResource('formVersions', () => ({
    transformResponse: transformForms
  }));
  const formVersionXml = createResource('formVersionXml');
  const publicLinks = createResource('publicLinks');
  const formDraftDatasetDiff = createResource('formDraftDatasetDiff');
  const formDatasetDiff = createResource('formDatasetDiff');
  return {
    form, formDraft, attachments, formVersions, formVersionXml, publicLinks, formDraftDatasetDiff, formDatasetDiff
  };
};
