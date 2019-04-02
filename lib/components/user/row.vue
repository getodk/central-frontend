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
  <tr :class="{ success: user.id === highlighted }">
    <td>{{ user.email }}</td>
    <td>Yes</td>
    <td class="user-actions">
      <div class="dropdown">
        <button :id="actionsButtonId" type="button"
          class="btn btn-primary dropdown-toggle" data-toggle="dropdown"
          aria-haspopup="true" aria-expanded="false">
          <span class="icon-cog"></span><span class="caret"></span>
        </button>
        <ul :aria-labelledby="actionsButtonId" class="dropdown-menu">
          <li>
            <a href="#" @click.prevent="$emit('reset-password', user)">
              Reset password
            </a>
          </li>
        </ul>
      </div>
    </td>
  </tr>
</template>

<script>
export default {
  name: 'UserRow',
  props: {
    user: {
      type: Object,
      required: true
    },
    highlighted: Number // eslint-disable-line vue/require-default-prop
  },
  computed: {
    actionsButtonId() {
      return `user-row-actions-button${this.user.id}`;
    }
  }
};
</script>
