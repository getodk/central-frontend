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
    <td class="name">
      <form-link :form="form"/>
      <span v-if="showIdForDuplicateName" class="duplicate-form-id">({{ form.xmlFormId }})</span>
    </td>

    <td v-for="reviewState of visibleReviewStates" :key="reviewState" class="review-state">
      <template v-if="form.publishedAt != null">
        <link-if-can :to="formPath(form.projectId, form.xmlFormId, `submissions?reviewState=${urlFilterEncode.get(reviewState)}`)"
          v-tooltip.no-aria="$t(`reviewState.${reviewState}`)">
          <span>{{ $n(form.reviewStates[reviewState], 'default') }}</span>
          <span :class="reviewStateIcon(reviewState)"></span>
        </link-if-can>
      </template>
    </td>

    <template v-if="form.publishedAt != null">
      <td class="last-submission">
        <span v-tooltip.no-aria="lastSubmissionTooltip">
          <template v-if="form.lastSubmission != null">
            <link-if-can :to="formPath(form.projectId, form.xmlFormId, 'submissions')">
              <date-time :iso="form.lastSubmission" relative="past"
                :tooltip="false"/>
              <span class="icon-clock-o"></span>
            </link-if-can>
          </template>
          <template v-else>{{ $t('submission.noSubmission') }}</template>
        </span>
      </td>
      <td class="total-submissions">
        <link-if-can :to="formPath(form.projectId, form.xmlFormId, 'submissions')"
          v-tooltip.no-aria="$t('common.totalSubmissions')">
          <span>{{ $n(form.submissions, 'default') }}</span>
          <span class="icon-asterisk"></span>
        </link-if-can>
      </td>
    </template>
    <template v-else>
      <td class="not-published" colspan="2">
        <span>{{ $t('formState.unpublished') }}</span>
        <span class="icon-asterisk"></span>
      </td>
    </template>

    <td v-if="showActions" class="actions">
      <template v-if="form.state !== 'closed'">
        <template v-if="form.state === 'closing'">
          <span aria-hidden="true" v-tooltip.sr-only>
            <span class="icon-clock-o closing-icon"></span>
            <span>{{ $t('formState.closing') }}</span>
          </span>
          <span class="sr-only">{{ $t('formClosingTip') }}</span>
        </template>
        <template v-else-if="form.publishedAt != null">
          <enketo-preview v-if="project.permits('project.update')"
            :form-version="form"/>
          <enketo-fill v-else :form-version="form">
            <span class="icon-edit"></span>{{ $t('action.fill') }}
          </enketo-fill>
        </template>
        <template v-else>
          <router-link :to="editPath" class="btn btn-default">
            <span class="icon-pencil"></span>
            <span>{{ $t('action.edit') }}</span>
          </router-link>
        </template>
      </template>
    </td>
  </tr>
</template>

<script>
import { DateTime } from 'luxon';

import DateTimeComponent from '../date-time.vue';
import EnketoFill from '../enketo/fill.vue';
import EnketoPreview from '../enketo/preview.vue';
import FormLink from './link.vue';
import LinkIfCan from '../link-if-can.vue';

import useReviewState from '../../composables/review-state';
import useRoutes from '../../composables/routes';
import { formatDateTime } from '../../util/date-time';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormRow',
  components: {
    DateTime: DateTimeComponent,
    EnketoFill,
    EnketoPreview,
    FormLink,
    LinkIfCan
  },
  props: {
    form: {
      type: Object,
      required: true
    },
    showActions: {
      type: Boolean,
      default: true
    }
  },
  setup() {
    const { project, duplicateFormNames } = useRequestData();
    const { formPath } = useRoutes();
    const { reviewStateIcon } = useReviewState();
    return {
      project, duplicateFormNames,
      formPath,
      reviewStateIcon
    };
  },
  computed: {
    visibleReviewStates: () => ['received', 'hasIssues', 'edited'],
    urlFilterEncode() {
      return new Map()
        .set('received', 'null')
        .set('hasIssues', '%27hasIssues%27')
        .set('edited', '%27edited%27');
    },
    editPath() {
      return this.formPath(
        this.form.projectId,
        this.form.xmlFormId,
        'draft'
      );
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
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.form-row {
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

  .review-state, .total-submissions, .not-published {
    a { @include text-link; }
    text-align: right;
    width: 100px;
    & [class*='icon'] {
      margin-left: 5px;
      color: #888;
    }
  }

  .review-state a {
    display: block;
    border-radius: 9999px;
    padding: 4px 8px;
    margin: -4px;
    &:hover { background: #fff }
  }

  .total-submissions a {
    display: block;
    border-radius: 9999px;
    padding: 4px 8px;
    margin: -4px;
    &:hover { background: #e8e8e8 }
  }

  .actions {
    width: 100px;
    // Make sure there is enough width for .btn-web-form so that toggling Web
    // Forms does not change the width of the column.
    &:has(.enketo-preview) { min-width: 127px; }
  }

  .last-submission{
    a { @include text-link; }
    text-align: right;
    width: 150px;
    & [class*='icon'] {
      margin-left: 5px;
      color: #888;
    }
  }

  .closing-icon {
    margin-right: 5px;
    color: #888;
  }

  td.review-state {
    background-color: #eee;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      // This appears on a button linking to a fillable Form
      "fill": "Fill Form"
    },
    "formClosingTip": "This Form is Closing and accepting its final Submissions. It is not downloadable but still accepts Submissions."
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "action": {
      "fill": "Vyplnit formulář"
    },
    "formClosingTip": "Tento formulář se uzavírá a přijímá poslední podání. Není ke stažení, ale stále přijímá příspěvky."
  },
  "de": {
    "action": {
      "fill": "Formular ausfüllen"
    },
    "formClosingTip": "Dieses Formular steht auf Schliessen und akzeptiert seine endgültigen Übermittlungen. Es kann nicht heruntergeladen werden, aber Übermittlungen werden noch akzeptiert."
  },
  "es": {
    "action": {
      "fill": "Llenar formulario"
    },
    "formClosingTip": "Este formulario se está cerrando y aceptando sus Envíos finales. No se puede descargar, pero aún acepta Envíos."
  },
  "fr": {
    "action": {
      "fill": "Remplir le formulaire"
    },
    "formClosingTip": "Ce formulaire est en cours de fermeture et accepte ses dernières soumissions. Il n'est plus téléchargeable mais peut encore recevoir des soumissions."
  },
  "id": {
    "action": {
      "fill": "Isi Formulir"
    }
  },
  "it": {
    "action": {
      "fill": "Compila il Formulario"
    },
    "formClosingTip": "Questo Formulario è in fase di chiusura e accetta i suoi ultimi Invii. Non è scaricabile ma tuttavia accetta Invii."
  },
  "ja": {
    "action": {
      "fill": "フォームに記入"
    }
  },
  "pt": {
    "action": {
      "fill": "Preencher formulário"
    },
    "formClosingTip": "Este Formulário está sendo fechado e aceitando suas respostas finais. Ele não pode ser baixado, mas ainda aceita Respostas."
  },
  "sw": {
    "action": {
      "fill": "Jaza Fomu"
    },
    "formClosingTip": "Fomu Hii Inafungwa na inakubali Mawasilisho yake ya mwisho. Haiwezi kupakuliwa lakini bado inakubali Mawasilisho."
  },
  "zh": {
    "action": {
      "fill": "请填写表格"
    },
    "formClosingTip": "此表单即将关闭并接收最终提交。当前不可下载但仍可接收提交。"
  },
  "zh-Hant": {
    "action": {
      "fill": "填寫表格"
    },
    "formClosingTip": "該表格即將結束並接受其最終提交資料。它不可下載，但仍接受提交。"
  }
}
</i18n>
