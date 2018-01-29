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
  <modal :state="state" @hide="$emit('hide')" backdrop>
    <template slot="title">Create Form</template>
    <template slot="body">
      <alert v-bind="alert" @close="alert.state = false"/>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label for="form-new-xml">Form XML *</label>
          <textarea v-model="xml" id="form-new-xml" class="form-control"
            required :disabled="awaitingResponse" rows="10">
          </textarea>
        </div>
        <button type="submit" class="btn btn-primary" :disabled="awaitingResponse">
          Create <spinner :state="awaitingResponse"/>
        </button>
        <button type="button" class="btn btn-default" @click="$emit('hide')">
          Close
        </button>
      </form>
    </template>
  </modal>
</template>

<script>
import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  name: 'FormNew',
  mixins: [alert(), request()],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      alert: alert.blank(),
      requestId: null,
      xml: ''
    };
  },
  methods: {
    submit() {
      const headers = { 'Content-Type': 'application/xml' };
      this
        .post('/forms', this.xml, { headers })
        .then(form => {
          this.$emit('hide');
          this.alert = alert.blank();
          this.xml = '';
          this.$emit('create', form);
        })
        .catch(() => {});
    }
  }
};
</script>
