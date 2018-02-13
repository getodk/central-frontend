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
    <navbar/>
    <div class="container-fluid">
      <router-view/>
    </div>
  </div>
</template>

<script>
import Navbar from './navbar.vue';

export default {
  name: 'App',
  components: { Navbar }
};
</script>

<style lang="sass">
// Global styles should go here.

@import '../../assets/scss/bootstrap';
@import '../../assets/scss/icomoon';
@import '../../assets/scss/variables';

html {
  background-color: $color-accent-secondary;
  min-height: 100%;
}
body {
  background-color: $color-page-background;
  background-image: linear-gradient(0deg, #e4e4e4, $color-page-background 40%);
  box-shadow: 0 -2px 0 #777 inset;
  color: #333;
  min-height: 100vh;
}

.table > thead {
  background-color: #ddd;
}

[class^="icon-"], [class*=" icon-"] {
  vertical-align: middle;
}

.btn {
  border: none;
  border-radius: 2px;
  font-size: 12px;
  overflow: hidden;
  padding: 6px 10px 5px;
  position: relative;
}
.btn-primary {
  background-color: $color-action-background;
  &:hover, &:focus {
    background-color: $color-action-background-hover;
  }
}

.form-group {
  display: block;
  font-weight: normal;
  padding-bottom: 15px;

  input {
    background: $color-input-background;
    border: none;
    border-bottom: 1px solid $color-action-inactive;
    border-radius: 0;
    box-shadow: none;
    position: relative;
    z-index: 1;

    &:focus {
      border-bottom-color: $color-action-foreground;
      box-shadow: none;

      + .form-label {
        color: $color-action-foreground;
      }
    }

    &::placeholder {
      color: $color-text;
    }

    &:placeholder-shown + .form-label {
      transform: translateY(-12px);
    }
  }

  .form-label {
    color: $color-action-inactive;
    display: block;
    font-size: 11px;
    height: 0;
    padding-left: 12px;
    transform: translateY(2px);
    transition: 0.15s transform, 0.15s color;
  }
}

.table {
  > thead {
    background-color: $color-table-heading-background;
    > tr > th {
      border-bottom: 1px solid $color-table-heading-border;
      font-size: 12px;
      padding: 8px 9px 6px;
    }
  }
}
</style>
