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
    <div class="row">
      <div class="col-xs-8">
        <form-edit :form="form" @alert="setAlert"/>
      </div>
    </div>
  </div>
</template>

<script>
import FormEdit from './edit.vue';
import alert from '../../mixins/alert';

export default {
  name: 'FormSettings',
  components: { FormEdit },
  mixins: [alert()],
  props: {
    form: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      alert: alert.blank()
    };
  },
  methods: {
    setAlert(alertObj) {
      this.$emit('alert');
      this.alert = alertObj;
    }
  }
};
</script>
