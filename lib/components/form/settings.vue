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
  <div id="form-settings">
    <div class="row">
      <div class="col-xs-8">
        <form-edit :form="form" @state-change="emitStateChange"/>
      </div>
      <div class="col-xs-4">
        <div class="panel panel-simple-danger">
          <div class="panel-heading">
            <h1 class="panel-title">Danger Zone</h1>
          </div>
          <div class="panel-body">
            <p class="text-center">
              <button :disabled="awaitingResponse" type="button"
                class="btn btn-danger" @click="deleteForm.state = true">
                Delete this form
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
    <form-delete :state="deleteForm.state" :form="form"
      @hide="deleteForm.state = false" @success="afterDelete"/>
  </div>
</template>

<script>
import FormDelete from './delete.vue';
import FormEdit from './edit.vue';
import modal from '../../mixins/modal';

export default {
  name: 'FormSettings',
  components: { FormEdit, FormDelete },
  mixins: [modal('deleteForm')],
  // Setting this in order to ignore the `attachments` attribute.
  inheritAttrs: false,
  props: {
    form: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      deleteForm: {
        state: false
      }
    };
  },
  methods: {
    emitStateChange(newState) {
      this.$emit('state-change', newState);
    },
    afterDelete() {
      this.$router.push('/forms', () => {
        const name = this.form.name != null
          ? this.form.name
          : this.form.xmlFormId;
        this.$alert().success(`The form “${name}” was deleted.`);
      });
    }
  }
};
</script>

<style lang="sass">
#form-settings .panel-simple-danger .panel-body p {
  margin-bottom: 15px;
  margin-top: 10px;
}
</style>
