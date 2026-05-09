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
import { shallowReactive, watchSyncEffect } from 'vue';

import { computeIfExists, setupOption, transformForm, transformForms } from './util';
import { useRequestData } from './index';

export default () => {
  const { form, createResource } = useRequestData();

  const formVersions = createResource('formVersions', () => ({
    transformResponse: transformForms
  }));
  const formVersionXml = createResource('formVersionXml');

  const formDraft = createResource('formDraft', () =>
    setupOption(data => shallowReactive(transformForm(data))));

  const mapAttachments = (attachments) => attachments.reduce(
    (map, attachment) => map.set(attachment.name, attachment),
    new Map()
  );
  // Form draft attachments
  const draftAttachments = createResource('draftAttachments', () => ({
    transformResponse: ({ data }) => shallowReactive(mapAttachments(data)),
    missingCount: computeIfExists(() => {
      let count = 0;
      for (const attachment of draftAttachments.values()) {
        if (!attachment.exists) count += 1;
      }
      return count;
    })
  }));
  // Published form attachments
  const publishedAttachments = createResource('publishedAttachments', () => ({
    transformResponse: ({ data }) => mapAttachments(data),
    linkedDatasets: computeIfExists(() => {
      const datasets = [];
      for (const attachment of publishedAttachments.values()) {
        if (attachment.datasetExists)
          datasets.push(attachment.name.replace(/\.csv$/i, ''));
      }
      return datasets;
    })
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
  const formDraftDatasetDiff = createResource('formDraftDatasetDiff', () => ({
    counts: computeIfExists(() => {
      let updatedDatasets = 0;
      let newProperties = 0;
      for (const dataset of formDraftDatasetDiff) {
        if (dataset.isNew) {
          updatedDatasets += 1;
          newProperties += dataset.properties.length;
        } else {
          const propertySubcount = dataset.properties.reduce(
            (count, property) => (property.isNew ? count + 1 : count),
            0
          );
          if (propertySubcount !== 0) {
            updatedDatasets += 1;
            newProperties += propertySubcount;
          }
        }
      }
      return { updatedDatasets, newProperties };
    })
  }));

  const appUserCount = createResource('appUserCount', () => ({
    transformResponse: ({ data }) => data.length
  }));

  return {
    form,
    formVersions,
    formVersionXml,
    formDraft,
    draftAttachments,
    publishedAttachments,
    publicLinks,
    formDatasetDiff,
    formDraftDatasetDiff,
    appUserCount
  };
};
