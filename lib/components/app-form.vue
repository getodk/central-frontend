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
  <form ref="form" @submit.prevent="$emit('submit')">
    <slot></slot>
  </form>
</template>

<script>
import $ from 'jquery';

export default {
  name: 'AppForm',
  mounted() {
    $(this.$refs.form)
      .find('input, select, textarea')
      .filter(':enabled:not([read-only])')
      .first()
      .focus();
  }
};
</script>
