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
  <multiselect id="audit-filters-action" single :model-value="selectValue"
    :options="options" :label="$t('field.type')" :placeholder="placeholder"
    :none="categoryMessage('nonverbose')" @update:model-value="update"/>
</template>

<script>
import Multiselect from '../../multiselect.vue';

import useAudit from '../../../composables/audit';

const ACTIONS_BY_CATEGORY = {
  user: [
    'user.create',
    'user.update',
    'user.assignment.create',
    'user.assignment.delete',
    'user.session.create',
    'user.delete'
  ],
  project: [
    'project.create',
    'project.update',
    'project.delete',
    'actor_property.create'
  ],
  form: [
    'form.create',
    'form.update',
    'form.update.draft.set',
    'form.update.publish',
    'form.update.draft.delete',
    'form.update.draft.replace',
    'form.update.draft.update',
    'form.attachment.update',
    'form.submission.export',
    'form.delete',
    'form.purge',
    'form.restore'
  ],
  field_key: [
    'field_key.create',
    'field_key.assignment.create',
    'field_key.assignment.delete',
    'field_key.session.end',
    'field_key.delete',
    'field_key.property.set'
  ],
  public_link: [
    'public_link.create',
    'public_link.assignment.create',
    'public_link.assignment.delete',
    'public_link.session.end',
    'public_link.delete',
    'public_link.property.set'
  ],
  dataset: [
    'dataset.create',
    'dataset.update',
    'entity.bulk.upsert',
    'entity.bulk.delete',
    'entity.bulk.restore',
    'dataset.delete',
    'dataset.update.property.delete'
  ],
  config: ['config.set'],
  upgrade: []
};

export default {
  name: 'AuditFiltersAction',
  components: { Multiselect },
  props: {
    modelValue: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue'],
  setup() {
    const { categoryMessage, actionMessage } = useAudit();
    return { categoryMessage, actionMessage };
  },
  computed: {
    options() {
      const all = this.$t('action.all');
      const options = [];
      for (const [category, actions] of Object.entries(ACTIONS_BY_CATEGORY)) {
        const text = this.categoryMessage(category);
        options.push({ text: `${all} ${text}`, value: category, group: text });
        for (const action of actions) {
          options.push({
            text: this.actionMessage(action),
            value: action,
            group: text
          });
        }
      }
      return options;
    },
    selectValue() {
      return this.modelValue === 'nonverbose' ? [] : [this.modelValue];
    },
  },
  methods: {
    placeholder({ selectedText }) {
      return selectedText == null
        ? this.categoryMessage('nonverbose')
        : selectedText.startsWith(`${this.$t('action.all')} `)
          ? selectedText.slice(this.$t('action.all').length + 1)
          : selectedText;
    },
    update(value) {
      this.$emit('update:modelValue', value[0] ?? 'nonverbose');
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "action": {
      "all": "All"
    }
  }
}
</i18n>
