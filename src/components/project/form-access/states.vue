<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="project-form-access-states" :state="state" hideable backdrop
    @hide="$emit('hide')">
    <template #title>Form States</template>
    <template #body>
      <div class="modal-introduction">
        <p>
          Form States control the lifecycle state of each Form. Usually, but not
          always, a Form will start Open and proceed through Closing to Closed
          when it is no longer needed.
        </p>
        <p>
          <strong>Open</strong> Forms are available to download on mobile
          devices, and will accept new Submissions.
        </p>
        <p>
          <strong>Closing</strong> Forms will accept new Submissions, but are
          <em>not</em> available to download on mobile devices.
        </p>
        <p>
          <strong>Closed</strong> Forms are <em>not</em> available to download
          on mobile devices, and will <em>not</em> accept new Submissions.
        </p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="$emit('hide')">
          Okay
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import Modal from '../../modal.vue';

export default {
  name: 'ProjectFormAccessStates',
  components: { Modal },
  props: {
    state: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style lang="scss">
#project-form-access-states {
  .modal-introduction p:first-child {
    margin-bottom: 20px;
  }
}
</style>
