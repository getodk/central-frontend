<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="submission-diff-container">
    <submission-diff-item v-for="(diff, index) in visibleDiffs" :key="index" :entry="diff" :fields="binaryFields"/>
  </div>
</template>

<script>
import { last } from 'ramda';

import SubmissionDiffItem from './diff-item.vue';

import { requestData } from '../../store/modules/request';


export default {
  name: 'SubmissionDiffContainer',
  components: { SubmissionDiffItem },
  props: {
    diffs: {
      type: Array,
      required: true
    }
  },
  computed: {
    ...requestData(['fields']),
    visibleDiffs() {
      // Filters out diffs about instanceID and deprecatedID
      return this.diffs.filter((entry) =>
        last(entry.path) !== 'instanceID' &&
        last(entry.path) !== 'deprecatedID');
    },
    binaryFields() {
      // Form fields transformed into an object for easily checking
      // if a field is a downloadable media file.
      return this.fields.filter((field) => (field.binary)).reduce((acc, cur) => ({ ...acc, [cur.path]: cur.binary }), {});
    }
  }
};
</script>
