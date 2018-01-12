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
    <div class="float-row-container">
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

<style lang="sass">
.float-row-container > * {
  float: right;
}

.float-row-clear {
  clear: right;
  margin-bottom: 20px;
}
</style>
