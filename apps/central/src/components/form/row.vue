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
          <span class="tag" :class="reviewState === 'hasIssues' && form.reviewStates[reviewState] > 0 ? reviewStateTag(reviewState) : 'tag-info'">
            <span :class="reviewStateIcon(reviewState)"></span>
            {{ $n(form.reviewStates[reviewState], 'default') }}
          </span>
        </link-if-can>
      </template>
    </td>

    <template v-if="form.publishedAt != null">
      <td class="last-submission">
        <span>
          <template v-if="form.lastSubmission != null">
            <link-if-can :to="formPath(form.projectId, form.xmlFormId, 'submissions')">
            <span class="icon-clock-o"></span>
              <date-time :iso="form.lastSubmission"
                :tooltip="false"/>
            </link-if-can>
          </template>
          <template v-else>{{ $t('submission.noSubmission') }}</template>
        </span>
      </td>
      <td class="total-submissions">
        <link-if-can :to="formPath(form.projectId, form.xmlFormId, 'submissions')"
          v-tooltip.no-aria="$t('common.totalSubmissions')">
          <span class="icon-star"></span>
          <span>{{ $n(form.submissions, 'default') }}</span>
        </link-if-can>
      </td>
    </template>
    <template v-else>
      <td class="not-published" colspan="2">
        <span>{{ $t('formState.unpublished') }}</span>
      </td>
    </template>

    <td v-if="showActions" class="actions">
      <template v-if="form.state !== 'closed'">
        <template v-if="form.state === 'closing'">
          <span aria-hidden="true" v-tooltip.sr-only>
            <span class="icon-clock-o closing-icon"></span>
            <span>{{ $t('formState.closing') }}</span>
          </span>
          <span class="sr-only">{{ formClosingTip }}</span>
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
import { joinSentences } from '../../util/i18n';
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
    const { reviewStateIcon, reviewStateTag } = useReviewState();
    return {
      project, duplicateFormNames,
      formPath,
      reviewStateIcon, reviewStateTag
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
    },
    formClosingTip() {
      return joinSentences(this.$i18n, [
        this.$t('formClosingTip[0]'),
        this.$t('formClosingTip[1]')
      ]);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.form-row {
  .table tbody & td { vertical-align: middle; }

  td {
    padding: 3px 0px 3px 6px;
    color: $color-text-secondary;
  }

  .duplicate-form-id {
    font-family: $font-family-monospace;
    font-size: 12px;
    padding-left: 6px;
  }

  .review-state, .total-submissions, .not-published {
    a { @include text-link; }
    & [class*='icon'] {
      color: $color-text-muted;
    }
  }

  .review-state a {
    border-radius: 9999px;
    margin: -4px;
    &:hover { background: $color-surface; }
  }

  .total-submissions a {
    display: block;
    border-radius: 9999px;
    padding: 4px 8px;
    margin: -4px;
    &:hover { background: $color-surface-secondary; }
  }

  .actions {
    .btn {
      width: 100%;
    }
  }

  .last-submission{
    a { @include text-link; }
    width: 150px;
    & [class*='icon'] {
      color: $color-text-muted;
    }
  }

  .closing-icon {
    margin-right: 5px;
    color: $color-text-muted;
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
    "formClosingTip": [
      "This Form is Closing.",
      // @transifexKey component.ProjectFormAccessStates.description.closing
      "New submissions can’t be started, but submissions already in progress can still be submitted."
    ]
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "action": {
      "fill": "Vyplnit formulář"
    }
  },
  "de": {
    "action": {
      "fill": "Formular ausfüllen"
    },
    "formClosingTip": [
      "Dieses Formular wird geschlossen.",
      "Neue Übermittlungen können nicht gestartet werden, aber bereits laufende Übermittlungen können weiterhin abgeschlossen werden."
    ]
  },
  "es": {
    "action": {
      "fill": "Llenar formulario"
    }
  },
  "fr": {
    "action": {
      "fill": "Remplir le formulaire"
    },
    "formClosingTip": [
      "Ce formulaire est en cours de fermeture.",
      "Aucune nouvelle soumission ne peut être commencée, mais celles en cours peuvent encore être envoyées."
    ]
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
    "formClosingTip": [
      "Questo formulario è in chiusura.",
      "Non è possibile avviare nuove compilazioni, ma quelle già in corso possono ancora essere inviate."
    ]
  },
  "ja": {
    "action": {
      "fill": "フォームに記入"
    }
  },
  "pt": {
    "action": {
      "fill": "Preencher formulário"
    }
  },
  "sw": {
    "action": {
      "fill": "Jaza Fomu"
    }
  },
  "zh": {
    "action": {
      "fill": "请填写表格"
    },
    "formClosingTip": [
      "此表单即将关闭。",
      "无法发起新的提交，但已在进行中的仍可继续提交。"
    ]
  },
  "zh-Hant": {
    "action": {
      "fill": "填寫表格"
    },
    "formClosingTip": [
      "此表單即將關閉。",
      "無法開始填寫新的提交資料，但仍可提交已在填寫中的資料。"
    ]
  }
}
</i18n>
