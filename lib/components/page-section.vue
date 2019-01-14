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
  <div class="page-section">
    <div class="page-section-heading">
      <slot name="heading"></slot>
    </div>
    <div>
      <slot name="body"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageSection'
};
</script>

<style lang="sass">
.page-section {
  border-top: 1px solid #777;
  margin-bottom: 30px;
}

.page-section-heading {
  font-size: 24px;
  margin-bottom: 20px;
  margin-top: 10px;

  > span:first-child {
    color: #555;
    font-weight: bold;
    // In case there is a button next to the heading title
    margin-right: 6px;
  }
}
</style>
