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
    <alert v-for="(alert, index) in list" :key="alert.id" v-bind="alert"
      @dismiss="$emit('dismiss', index)"/>
  </div>
</template>

<script>
import Alert from './alert.vue';

export default {
  name: 'Alerts',
  props: {
    list: {
      type: Array,
      required: true
    }
  },
  components: { Alert }
};
</script>

<style lang="sass" scoped>
.alert {
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 20px;
  }
}
</style>
