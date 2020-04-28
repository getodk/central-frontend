<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="float-row">
    <div class="float-row-left">
      <slot name="left"></slot>
    </div>
    <div class="float-row-right">
      <slot name="right"></slot>
      <slot></slot>
    </div>
    <div class="float-row-clear"></div>
  </div>
</template>

<script>
export default {
  name: 'FloatRow'
};
</script>

<style lang="scss">
.float-row-left {
  float: left;
}

.float-row-right {
  float: right;
}

.float-row-clear {
  clear: both;
}
</style>
