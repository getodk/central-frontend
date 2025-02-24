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
import { reactive, watchSyncEffect } from 'vue';

import { computeIfExists, setupOption, transformForms } from './util';
import { useRequestData } from './index';

export default () => {
  const { form, formDraft, createResource } = useRequestData();

  const formVersions = createResource('formVersions', () => ({
    transformResponse: transformForms
  }));
  const formVersionXml = createResource('formVersionXml');

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

  // Published form attachments
  const publishedAttachments = createResource('publishedAttachments', () => ({
    linkedDatasets: computeIfExists(() => publishedAttachments
      .filter(a => a.datasetExists)
      .map(a => a.name.replace(/\.csv$/i, '')))
  }));

  const publicLinks = createResource('publicLinks', () => ({
    activeCount: computeIfExists(() => publicLinks.reduce(
      (count, { token }) => count + (token != null ? 1 : 0),
      0
    ))
  }));
  watchSyncEffect(() => {
    if (form.dataExists && publicLinks.dataExists &&
      form.publicLinks !== publicLinks.activeCount)
      form.publicLinks = publicLinks.activeCount;
  });

  const formDatasetDiff = createResource('formDatasetDiff');
  const formDraftDatasetDiff = createResource('formDraftDatasetDiff');

  const appUserCount = createResource('appUserCount', () => ({
    transformResponse: ({ data }) => data.length
  }));

  return {
    form,
    formDraft,
    formVersions,
    formVersionXml,
    attachments,
    publishedAttachments,
    publicLinks,
    formDatasetDiff,
    formDraftDatasetDiff,
    appUserCount
  };
};
