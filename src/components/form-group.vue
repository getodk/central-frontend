<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->

<!-- Use this component for a .form-group element with a label. (Use HTML for a
.form-group element without a label.) -->
<template>
  <label class="form-group" :class="{ 'has-error': hasError }">
    <slot name="before"></slot>
    <input ref="input" v-bind="$attrs" class="form-control" :value="value"
      :placeholder="`${placeholder}${star}`" :required="required"
      :autocomplete="autocomplete" @input="$emit('input', $event.target.value)"
      @change="$emit('change', $event.target.value)">
    <span class="form-label">{{ placeholder }}{{ star }}</span>
    <password v-if="strengthmeter" v-model="value" :strength-meter-only="true"
      strength-meter-class="Password__strength-meter password-strength"/>
    <slot name="after"></slot>
  </label>
</template>

<script>
export default {
  name: 'FormGroup',
  components: {
    Password: () => import('vue-password-strength-meter')
  },
  inheritAttrs: false,
  props: {
    value: {
      type: String,
      required: true
    },
    placeholder: {
      type: String,
      required: true
    },
    required: {
      type: Boolean,
      default: false
    },
    hasError: {
      type: Boolean,
      default: false
    },
    autocomplete: {
      type: String,
      required: true
    },
    strengthmeter: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    star() {
      return this.required ? ' *' : '';
    }
  },
  methods: {
    focus() {
      this.$refs.input.focus();
    }
  }
};
</script>

<style lang="scss">
@import '../assets/scss/variables';

.form-group {
  .form-control {
    &:focus + .form-label { color: $color-action-foreground; }
    &:placeholder-shown + .form-label { transform: translateY(-15px); }
  }

  .form-label {
    color: $color-input-inactive;
    display: block;
    font-size: 11px;
    height: 0;
    padding-left: 12px;
    transform: translateY(2px);
    transition: 0.15s transform, 0.15s color;
  }
}

.has-error {
  .form-label { color: $color-danger; }
  .form-control:focus + .form-label { color: $color-danger-dark; }
}
</style>
