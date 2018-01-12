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
  <div id="page-head" class="row">
    <div class="col-xs-12">
      <h1><slot name="title"></slot></h1>
      <p><slot name="body"></slot></p>
      <ul class="nav nav-tabs" role="tablist">
        <slot name="tabs"></slot>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageHead'
};
</script>

<style lang="sass">
#page-head {
  background-color: #eee;
  margin-bottom: 15px;

  & > .col-xs-12 {
    & > p {
      max-width: 650px;
    }

    & > .nav-tabs {
      border-bottom: none;

      & > li {
        margin-top: 10px;
        margin-bottom: 0;

        & > a {
          border-bottom: none;
        }
      }
    }
  }
}
</style>
