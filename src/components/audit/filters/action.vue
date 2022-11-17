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
  <label id="audit-filters-action" class="form-group">
    <select class="form-control" :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)">
      <option v-for="option of options" :key="option.value"
        :class="option.htmlClass" :value="option.value">
        {{ option.text }}
      </option>
    </select>
    <span class="form-label">{{ $t('field.type') }}</span>
  </label>
</template>

<script>
import useAudit from '../../../composables/audit';

export default {
  name: 'AuditFiltersAction',
  props: {
    modelValue: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup() {
    const { actionMessage } = useAudit();
    return { actionMessage };
  },
  computed: {
    options() {
      return [
        this.categoryOption('nonverbose'),
        this.categoryOption('user'),
        this.actionOption('user.create'),
        this.actionOption('user.update'),
        this.actionOption('user.assignment.create'),
        this.actionOption('user.assignment.delete'),
        this.actionOption('user.session.create'),
        this.actionOption('user.delete'),
        this.categoryOption('project'),
        this.actionOption('project.create'),
        this.actionOption('project.update'),
        this.actionOption('project.delete'),
        this.categoryOption('form'),
        this.actionOption('form.create'),
        this.actionOption('form.update'),
        this.actionOption('form.update.draft.set'),
        this.actionOption('form.update.publish'),
        this.actionOption('form.update.draft.delete'),
        this.actionOption('form.attachment.update'),
        this.actionOption('form.submission.export'),
        this.actionOption('form.delete'),
        this.actionOption('form.purge'),
        this.actionOption('form.restore'),
        this.categoryOption('field_key'),
        this.actionOption('field_key.create'),
        this.actionOption('field_key.assignment.create'),
        this.actionOption('field_key.assignment.delete'),
        this.actionOption('field_key.session.end'),
        this.actionOption('field_key.delete'),
        this.categoryOption('public_link'),
        this.actionOption('public_link.create'),
        this.actionOption('public_link.assignment.create'),
        this.actionOption('public_link.assignment.delete'),
        this.actionOption('public_link.session.end'),
        this.actionOption('public_link.delete'),
        this.categoryOption('dataset'),
        this.actionOption('dataset.create'),
        this.actionOption('dataset.update'),
        this.actionOption('dataset.update.publish'),
        this.categoryOption('config'),
        this.actionOption('config.set')
      ];
    }
  },
  methods: {
    categoryOption(category) {
      return {
        text: this.$t(`audit.category.${category}`),
        value: category,
        htmlClass: 'audit-filters-action-category'
      };
    },
    actionOption(action) {
      return {
        // Adding non-breaking spaces: see #323 on GitHub.
        text: `\u00a0\u00a0\u00a0${this.actionMessage(action)}`,
        value: action
      };
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
