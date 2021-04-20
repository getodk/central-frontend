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
  <form id="submission-comment" @submit.prevent="submit">
    <div class="form-group">
      <textarea v-model.trim="body" class="form-control"
        :placeholder="$t('field.comment')" :aria-label="$t('field.comment')"
        required rows="2">
      </textarea>
    </div>
    <button v-show="body !== '' || awaitingResponse" type="submit"
      class="btn btn-primary" :disabled="awaitingResponse">
      {{ $t('action.comment') }} <spinner :state="awaitingResponse"/>
    </button>
  </form>
</template>

<script>
import Spinner from '../spinner.vue';

import request from '../../mixins/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

export default {
  name: 'SubmissionComment',
  components: { Spinner },
  mixins: [request()],
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
    }
  },
  data() {
    return {
      awaitingResponse: false,
      body: ''
    };
  },
  methods: {
    submit() {
      this.request({
        method: 'POST',
        url: apiPaths.submissionComments(
          this.projectId,
          this.xmlFormId,
          this.instanceId
        ),
        data: { body: this.body }
      })
        .then(() => {
          this.$emit('success');
          this.body = '';
        })
        .catch(noop);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#submission-comment {
  @include clearfix;
  margin-bottom: 20px;

  .form-group {
    margin-bottom: 5px;
    padding-bottom: 0;
  }

  .btn { float: right; }
}
</style>
