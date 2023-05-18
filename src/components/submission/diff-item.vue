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
  <diff-item v-slot="{ parentPath, path, value, isOld }" v-bind="entry">
    <a v-if="isBinary(parentPath, path)" :href="binaryHref(value, isOld)">{{ value }}</a>
    <template v-else>{{ value }}</template>
  </diff-item>
</template>

<script>
import DiffItem from '../diff-item.vue';

import { apiPaths } from '../../util/request';
import { useRequestData } from '../../request-data';

export default {
  name: 'SubmissionDiffItem',
  components: { DiffItem },
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    },
    instanceId: {
      type: String,
      required: true
    },
    oldVersionId: {
      type: String,
      required: false // only used for making binary file link
    },
    newVersionId: {
      type: String,
      required: false // only used for making binary file link
    },
    entry: {
      type: Object,
      required: true
    }
  },
  setup() {
    const { fields } = useRequestData();
    return { fields };
  },
  methods: {
    isBinary(parentPath, path) {
      // Compares path as array by converting it to /field1/field2 string and checks
      // if it is for a binary field.
      // Filtering out where field[0] == undefined addresses issue with flattenDiff and repeat groups
      const fullPath = parentPath.concat(path.filter((field) => field[0] !== undefined));
      const fullPathStr = fullPath.map((field) => (Array.isArray(field) ? field[0] : field)).join('/');
      const basicPath = `/${fullPathStr}`;
      if (this.fields.binaryPaths.has(basicPath))
        return true;
      return false;
    },
    binaryHref(value, useOldVersion) {
      return apiPaths.submissionVersionAttachment(
        this.projectId,
        this.xmlFormId,
        this.instanceId,
        useOldVersion ? this.oldVersionId : this.newVersionId,
        value
      );
    }
  }
};
</script>
