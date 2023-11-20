<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <router-link :to="versionPath">{{ text }}</router-link>
</template>

<script setup>
import { computed, inject } from 'vue';
import { useI18n } from 'vue-i18n';

import useRoutes from '../../composables/routes';

defineOptions({
  name: 'EntityVersionLink'
});
const props = defineProps({
  uuid: {
    type: String,
    required: true
  },
  version: {
    type: Object,
    required: true
  }
});

const { entityPath } = useRoutes();
const projectId = inject('projectId');
const datasetName = inject('datasetName');
const versionPath = computed(() => {
  const path = entityPath(projectId, datasetName, props.uuid);
  return `${path}#v${props.version.version}`;
});

const { t } = useI18n();
const text = computed(() => {
  const { source } = props.version;
  const { submissionCreate } = source;
  if (submissionCreate != null) {
    const nameOrId = source.submission?.currentVersion?.instanceName ??
      submissionCreate.details.instanceId;
    return t('submission', { instanceName: nameOrId });
  }
  return t('api', { name: props.version.creator.displayName });
});
</script>

<i18n lang="json5">
{
  "en": {
    "submission": "Submission {instanceName}",
    "api": "Update by {name}"
  }
}
</i18n>
