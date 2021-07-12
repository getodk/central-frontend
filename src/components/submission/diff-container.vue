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
    <submission-diff-item v-for="(change, index) in visibleDiffs" :key="index" :entry="change"/>
  </div>
</template>

<script>
import SubmissionDiffItem from './diff-item.vue';

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
    visibleDiffs() {
      // Filters out diffs about instanceID and deprecatedID
      // TODO: write this long line of code in a shorter way?
      return this.diffs.filter((entry) => ((entry.path[entry.path.length - 1] !== 'instanceID' && entry.path[entry.path.length - 1] !== 'deprecatedID')));
    }
  }
};
</script>
