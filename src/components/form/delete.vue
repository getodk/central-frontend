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
  <modal id="form-delete" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')">
    <template slot="title">Delete Form</template>
    <template slot="body">
      <div class="modal-introduction">
        <p>
          Are you sure you want to delete the form
          <strong>{{ form.nameOrId() }}</strong> and all of its submissions?
        </p>
        <p>This action cannot be undone.</p>
      </div>
      <div class="modal-actions">
        <button :disabled="awaitingResponse" type="button"
          class="btn btn-danger" @click="del">
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
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormDelete',
  components: { Modal, Spinner },
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
  computed: requestData(['form']),
  methods: {
    del() {
      this.delete(apiPaths.form(this.form.projectId, this.form.xmlFormId))
        .then(() => {
          this.$emit('success', this.form);
        })
        .catch(noop);
    }
  }
};
</script>
