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
@import '../../assets/scss/variables';

#page-head {
  background-color: $color-subpanel-background;
  border-bottom: 1px solid $color-subpanel-border-strong;
  margin-bottom: 15px;

  h1 {
    font-size: 30px;
    font-weight: bold;
    letter-spacing: -0.02em;
    margin-bottom: 3px;
  }

  > .col-xs-12 {
    > p {
      color: #555;
      font-size: 15px;
      letter-spacing: -0.01em;
      max-width: 650px;
    }

    > .nav-tabs {
      border-bottom: none;

      &:empty {
        margin-top: 15px;
      }

      > li {
        margin-bottom: -1px;
        margin-right: 10px;
        margin-top: 5px;

        > a {
          border: none;
          border-bottom: 2px solid transparent;
          border-radius: 0;
          color: $color-text;
          padding: 7px 8px 6px;

          &:hover {
            border-bottom-color: $color-accent-primary;
          }
        }

        &.active > a {
          background-color: $color-subpanel-active;
          border-bottom-color: $color-accent-primary;
        }
      }
    }
  }
}
</style>
