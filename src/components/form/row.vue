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
  <tr class="form-row">
    <td>
      <div>
        <router-link :to="primaryFormPath(form)" class="form-row-name">
          {{ form.nameOrId() }} <span class="icon-angle-right"></span>
        </router-link>
      </div>
      <div v-if="form.name != null" class="form-row-form-id">
        {{ form.xmlFormId }}
      </div>
      <div class="form-row-submissions">
        {{ $tc('count.submission', form.submissions) }}
      </div>
    </td>
    <td class="form-row-created-by">
      <link-if-can v-if="form.createdBy != null"
        :to="userPath(form.createdBy.id)" :title="form.createdBy.displayName">
        {{ form.createdBy.displayName }}
      </link-if-can>
    </td>
    <td><date-time :iso="form.publishedAt"/></td>
    <td><date-time :iso="form.lastSubmission"/></td>
  </tr>
</template>

<script>
import DateTime from '../date-time.vue';
import Form from '../../presenters/form';
import LinkIfCan from '../link-if-can.vue';
import routes from '../../mixins/routes';

export default {
  name: 'FormRow',
  components: { DateTime, LinkIfCan },
  mixins: [routes()],
  props: {
    form: {
      type: Form,
      required: true
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.table tbody .form-row td {
  vertical-align: middle;
}

.form-row-name {
  font-size: 30px;

  &, &:hover, &:focus {
    color: inherit;
    text-decoration: none;
  }

  .icon-angle-right:first-child {
    color: $color-accent-primary;
    font-size: 20px;
    margin-left: 3px;
    margin-right: 0;
    vertical-align: 2px;
  }
}

.form-row-form-id {
  font-size: 18px;
}

.form-row-created-by {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
