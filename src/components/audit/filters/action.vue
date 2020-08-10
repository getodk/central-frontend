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
<template>
  <div id="audit-filters-action" class="form-group">
    <select class="form-control" :value="value" :aria-label="$t('field.type')"
      @change="$emit('input', $event.target.value)">
      <option v-for="option of options" :key="option.value"
        :class="option.htmlClass" :value="option.value">
        {{ option.text }}
      </option>
    </select>
  </div>
</template>

<script>
import i18n from '../../../i18n';
import { auditActionMessage } from '../../../util/i18n';

const categoryOption = (category) => ({
  text: i18n.t(`audit.category.${category}`),
  value: category,
  htmlClass: 'audit-filters-action-category'
});
const actionOption = (action) => ({
  // Adding non-breaking spaces: see #323 on GitHub.
  text: `\u00a0\u00a0\u00a0${auditActionMessage(action)}`,
  value: action
});
const options = [
  categoryOption('nonverbose'),
  categoryOption('user'),
  actionOption('user.create'),
  actionOption('user.update'),
  actionOption('assignment.create'),
  actionOption('assignment.delete'),
  actionOption('user.delete'),
  categoryOption('project'),
  actionOption('project.create'),
  actionOption('project.update'),
  actionOption('project.delete'),
  categoryOption('form'),
  actionOption('form.create'),
  actionOption('form.update'),
  actionOption('form.update.draft.set'),
  actionOption('form.update.publish'),
  actionOption('form.update.draft.delete'),
  actionOption('form.attachment.update'),
  actionOption('form.delete'),
  categoryOption('field_key'),
  actionOption('field_key.create'),
  categoryOption('public_link'),
  actionOption('public_link.create'),
  categoryOption('session'),
  actionOption('session.end')
];

export default {
  name: 'AuditFiltersAction',
  props: {
    value: {
      type: String,
      required: true
    }
  },
  computed: {
    options() {
      return options;
    }
  }
};
</script>

<style lang="scss">
.audit-filters-action-category {
  // Not all browsers support styling an <option> element this way.
  font-weight: bold;
}
</style>
