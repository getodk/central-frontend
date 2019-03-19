<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="backup-terminate" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')">
    <template slot="title">Terminate Automatic Backups</template>
    <template slot="body">
      <div class="modal-introduction">
        <p>Are you sure you want to terminate your automatic backups?</p>
        <p>
          You will have to reconfigure them again from scratch to start them
          again, and this action cannot be undone.
        </p>
      </div>
      <div class="modal-actions">
        <button :disabled="awaitingResponse" type="button"
          class="btn btn-danger" @click="terminate">
          Yes, proceed <spinner :state="awaitingResponse"/>
        </button>
        <button :disabled="awaitingResponse" type="button" class="btn btn-link"
          @click="$emit('hide')">
          No, cancel
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import request from '../../mixins/request';

export default {
  name: 'BackupTerminate',
  mixins: [request()],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      awaitingResponse: false
    };
  },
  methods: {
    terminate() {
      this
        .delete('/config/backups')
        .then(() => {
          this.$emit('hide');
          this.$alert().blank();
          this.$emit('success');
        })
        .catch(() => {});
    }
  }
};
</script>
