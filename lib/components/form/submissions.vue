<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <alert v-bind="alert" @close="alert.state = false"/>
    <loading :state="awaitingResponse"/>
    <!-- Render this element once the submissions have been fetched. -->
    <template v-if="submissions">
      <p v-if="submissions.length === 0">
        There are no submissions yet for <em>{{ xmlFormId }}</em>.
      </p>
      <table v-else class="table table-hover">
        <thead>
          <tr>
            <th>#</th>
            <th>Instance ID</th>
            <th>Reviewed</th>
            <th>Submitted by</th>
            <th>Submitted at</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(submission, index) in submissions"
            :key="submission.id">
            <td>{{ index + 1 }}</td>
            <td>{{ submission.instanceId }}</td>
            <!-- TODO: Not yet implemented. -->
            <td>???</td>
            <!-- TODO: Not yet implemented. -->
            <td>???</td>
            <td>{{ createdAt(submission) }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<script>
import moment from 'moment';

import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  name: 'FormSubmissions',
  mixins: [alert(), request()],
  props: {
    xmlFormId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      alert: alert.blank(),
      requestId: null,
      submissions: null
    };
  },
  watch: {
    alert() {
      this.$emit('alert');
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.submissions = null;
      this
        .get(`/forms/${this.xmlFormId}/submissions`)
        .then(submissions => {
          // Add a unique ID to each submission so that we can use the ID as the
          // v-for key.
          const submissionsWithIds = [];
          for (const submission of submissions) {
            const id = { id: this.$uniqueId() };
            const submissionWithId = Object.assign(id, submission);
            submissionsWithIds.push(submissionWithId);
          }
          this.submissions = submissionsWithIds;
        })
        .catch(() => {});
    },
    createdAt(submission) {
      return moment.utc(submission.createdAt).format('MMM D, Y H:mm:ss UTC');
    }
  }
};
</script>
