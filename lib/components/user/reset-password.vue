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
  <modal :state="state" @hide="$emit('hide')">
    <template slot="title">Reset Password</template>
    <template slot="body">
      <p>
        Once you click <strong>Reset Password</strong> below, the password for
        {{ user.email }} will be immediately invalidated. An email will be sent
        to {{ user.email }} with instructions on how to proceed.
      </p>
      <div>
        <button type="button" class="btn btn-primary" @click="resetPassword">
          Reset Password
        </button>
        <button type="button" class="btn btn-default" @click="$emit('hide')">
          Close
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
export default {
  name: 'UserPasswordReset',
  props: {
    state: Boolean,
    user: Object
  },
  methods: {
    // TODO. Not yet implemented.
    resetPassword() {
      this.$emit('hide');
    }
  }
};
</script>
