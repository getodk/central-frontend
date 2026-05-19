<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <tr class="form-trash-row">
    <td class="name">
      <span class="form-name">{{ form.nameOrId }}</span>
      <span v-if="showIdForDuplicateName" class="duplicate-form-id">({{ form.xmlFormId }})</span>
    </td>
    <td class="deleted">
      <i18n-t tag="div" keypath="deletedDate" class="deleted-date">
        <template #dateTime>
          <date-time :iso="form.deletedAt"/>
        </template>
      </i18n-t>
    </td>
    <td class="last-submission">
      <span v-tooltip.no-aria="lastSubmissionTooltip">
        <template v-if="form.lastSubmission != null">
          <date-time :iso="form.lastSubmission" relative="past"
            :tooltip="false"/>
          <span class="icon-clock-o"></span>
        </template>
        <template v-else>{{ $t('submission.noSubmission') }}</template>
      </span>
    </td>
    <td class="total-submissions">
      <span v-tooltip.no-aria="$t('common.totalSubmissions')">
        <!-- form.submissions should always exist in production, but it doesn't
        exist in some tests. -->
        <span>{{ $n(form.submissions != null ? form.submissions : 0, 'default') }}</span>
        <span class="icon-asterisk"></span>
      </span>
    </td>
    <td class="actions">
      <button class="form-trash-row-restore-button btn btn-default" type="button"
        :aria-disabled="disabled" v-tooltip.aria-describedby="disabledDescription"
        :data-form-id="form.id"
        @click="openRestoreModal(form)">
        <span class="icon-recycle"></span>{{ $t('action.restore') }}
      </button>
    </td>
  </tr>
</template>

<script>
import { DateTime } from 'luxon';

import DateTimeComponent from '../date-time.vue';

import { formatDateTime } from '../../util/date-time';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormTrashRow',
  components: { DateTime: DateTimeComponent },
  props: {
    form: {
      type: Object,
      required: true
    }
  },
  emits: ['start-restore'],
  setup() {
    // The component assumes that this data will exist when the component is
    // created.
    const { forms, deletedForms, duplicateFormNames } = useRequestData();
    return { forms, deletedForms, duplicateFormNames };
  },
  computed: {
    activeFormIds() {
      // returns ids of existing forms to disable restoring deleted
      // forms with conflicting ids (also prevented on backend)
      return (this.forms.dataExists
        ? this.forms.map((f) => f.xmlFormId)
        : []);
    },
    disabled() {
      return this.activeFormIds.includes(this.form.xmlFormId);
    },
    disabledDescription() {
      if (this.disabled)
        return this.$t('disabled.conflict');
      return null;
    },
    showIdForDuplicateName() {
      if (this.duplicateFormNames == null) return false;
      const name = this.form.nameOrId.toLocaleLowerCase();
      return this.duplicateFormNames.has(name);
    },
    lastSubmissionTooltip() {
      const { lastSubmission } = this.form;
      const header = this.$t('header.lastSubmission');
      if (lastSubmission == null) return header;
      const formatted = formatDateTime(DateTime.fromISO(lastSubmission));
      return `${header}\n${formatted}`;
    }
  },
  methods: {
    openRestoreModal(form) {
      this.$emit('start-restore', form);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.form-trash-row {
  .table tbody & td { vertical-align: middle; }

  td {
    font-size: 16px;
    padding: 3px 0px 3px 6px;
    color: #333;
  }

  .name {
    font-size: 18px;
  }

  .duplicate-form-id {
    font-family: $font-family-monospace;
    font-size: 12px;
    padding-left: 6px;
  }

  .deleted {
    width: 300px;
    text-align: right;
  }

  .last-submission {
    width: 150px;
  }

  .total-submissions {
    width: 100px;
  }

  .last-submission, .total-submissions {
    text-align: right;
    [class*='icon'] {
      margin-left: 5px;
      color: #888;
    }
  }

  .actions {
    width: 100px;
  }

  .deleted-date {
    color: $color-danger;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This text shows when the Form was deleted. {dateTime} shows
    // the date and time, for example: "2020/01/01 01:23". It may show a
    // formatted date like "2020/01/01", or it may use a word like "today",
    // "yesterday", or "Sunday".
    "deletedDate": "Deleted {dateTime}",
    "disabled": {
      "conflict": "This Form cannot be restored because an active Form with the same ID exists."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "deletedDate": "Smazáno {dateTime}"
  },
  "de": {
    "deletedDate": "Gelöscht {dateTime}",
    "disabled": {
      "conflict": "Dieses Formular kann nicht wiederhergestellt werden, weil ein aktives Formular mit derselben ID existiert."
    }
  },
  "es": {
    "deletedDate": "Borrado {dateTime}",
    "disabled": {
      "conflict": "Este formulario no se puede restablecer porque existe un formulario activo con el mismo ID."
    }
  },
  "fr": {
    "deletedDate": "Supprimé le {dateTime}",
    "disabled": {
      "conflict": "Ce formulaire ne peut être restauré car un Formulaire actif avec le même ID existe."
    }
  },
  "id": {
    "deletedDate": "Terhapus {dateTime}"
  },
  "it": {
    "deletedDate": "Eliminato {dateTime}",
    "disabled": {
      "conflict": "Questo formulario non può essere ripristinato perché esiste un formulario attivo con lo stesso ID."
    }
  },
  "ja": {
    "deletedDate": "削除 {dateTime}"
  },
  "pt": {
    "deletedDate": "Excluído {dateTime}"
  },
  "sw": {
    "deletedDate": "Imefutwa {dateTime}"
  },
  "zh": {
    "deletedDate": "{dateTime}已删除",
    "disabled": {
      "conflict": "无法恢复此表单，因存在同名ID的活跃表单。"
    }
  },
  "zh-Hant": {
    "deletedDate": "已刪除{dateTime}",
    "disabled": {
      "conflict": "該表單無法還原，因為存在具有相同 ID 的活動表單。"
    }
  }
}
</i18n>
