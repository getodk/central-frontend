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
      <link-if-can :to="primaryFormPath(form)">
        <span v-if="form.publishedAt == null" class="icon-edit form-icon-unpublished form-icon"
          :title="$t('formUnpublishedTip')"></span>
        <span v-else-if="form.state === 'closed'" class="icon-ban form-icon-closed form-icon"
          :title="$t('formClosedTip')"></span>
        <span v-else-if="form.state === 'closing'" class="icon-clock-o form-icon-closing form-icon"
          :title="$t('formClosingTip')"></span>
        <span :class="[form.state === 'closed' ? 'form-name-closed' : '']">{{ form.nameOrId() }}</span><span class="icon-angle-right"></span>
      </link-if-can>
    </td>
    <td v-if="columns.has('idAndVersion')" class="id-and-version">
      <div class="form-id">
        <span :title="form.xmlFormId">{{ form.xmlFormId }}</span>
      </div>
      <div v-if="form.version != null && form.version !== ''" class="version">
        <span :title="form.version">{{ form.version }}</span>
      </div>
    </td>
    <td v-if="columns.has('submissions')" class="submissions">
      <div v-if="form.publishedAt != null">
        <router-link :to="submissionsPath">
          <span>{{ $tcn('count.submission', form.submissions) }}</span>
          <span class="icon-angle-right"></span>
        </router-link>
      </div>
      <div v-if="form.lastSubmission != null">
        <router-link :to="submissionsPath">
          <i18n :tag="false" path="lastSubmission">
            <template #dateTime>
              <date-time :iso="form.lastSubmission"/>
            </template>
          </i18n>
        </router-link>
      </div>
    </td>
    <td v-if="columns.has('actions')" class="actions">
      <template v-if="form.publishedAt != null">
        <enketo-preview v-if="project.permits('project.update')"
          :form-version="form"/>
        <enketo-fill v-else :form-version="form">
          <span class="icon-edit"></span>{{ $t('action.fill') }}
        </enketo-fill>
      </template>
    </td>
  </tr>
</template>

<script>
import DateTime from '../date-time.vue';
import EnketoFill from '../enketo/fill.vue';
import EnketoPreview from '../enketo/preview.vue';
import LinkIfCan from '../link-if-can.vue';
import Form from '../../presenters/form';
import routes from '../../mixins/routes';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormRow',
  components: { DateTime, EnketoFill, EnketoPreview, LinkIfCan },
  mixins: [routes()],
  props: {
    form: {
      type: Form,
      required: true
    },
    columns: {
      type: Set,
      required: true
    }
  },
  computed: {
    // The component assumes that this data will exist when the component is
    // created.
    ...requestData(['project']),
    submissionsPath() {
      return this.formPath(
        this.form.projectId,
        this.form.xmlFormId,
        this.form.publishedAt != null ? 'submissions' : 'draft/testing'
      );
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.form-row {
  .table tbody & td { vertical-align: middle; }

  .name {
    .link-if-can { font-size: 24px; }
    a { @include text-link; }

    .icon-angle-right {
      font-size: 20px;
      margin-left: 9px;
    }

    .form-icon {
      font-size: 20px;
      margin-right: 9px;
      cursor: help;
    }

    .form-name-closed {
      color: #999;
    }

    .form-icon-unpublished {
      color: #999;
    }

    .form-icon-closed{
      color: $color-danger;
    }

    .form-icon-closing{
      color: $color-warning;
    }
  }

  .form-id, .version {
    @include text-overflow-ellipsis;
    font-family: $font-family-monospace;
  }

  .version { color: #888; }

  .submissions {
    a { @include text-link; }
    .icon-angle-right { margin-left: 6px; }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This text shows when the last Submission was received. {dateTime} shows
    // the date and time, for example: "2020/01/01 01:23". It may show a
    // formatted date like "2020/01/01", or it may use a word like "today",
    // "yesterday", or "Sunday".
    "lastSubmission": "(last {dateTime})",
    "action": {
      "fill": "Fill Form"
    },
    "formClosedTip": "This Form is Closed. It is not downloadable and does not accept Submissions.",
    "formClosingTip": "This Form is Closing. It is not downloadable but still accepts Submissions.",
    "formUnpublishedTip": "This Form does not yet have a published version.",
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "lastSubmission": "(poslední {dateTime})",
    "action": {
      "fill": "Vyplnit formulář"
    },
    "formClosedTip": "Tento formulář je uzavřen. Nelze jej stáhnout a nepřijímá příspěvky.",
    "formClosingTip": "Tento formulář se uzavírá. Nelze jej stáhnout, ale stále přijímá příspěvky.",
    "formUnpublishedTip": "Tento formulář dosud nemá publikovanou verzi."
  },
  "de": {
    "lastSubmission": "(zuletzt {dateTime})",
    "action": {
      "fill": "Formular ausfüllen"
    },
    "formClosedTip": "Dieses Formular ist geschlossen. Es kann nicht heruntergeladen werden und Übermittlungen werden nicht akzeptiert.",
    "formClosingTip": "Dieses Formular steht auf Schließen. Es kann nicht heruntergeladen werden, aber Übermittlungen werden noch akzeptiert.",
    "formUnpublishedTip": "Es gibt bisher noch keine veröffentlichte Version dieses Formulars."
  },
  "es": {
    "lastSubmission": "(último {dateTime})",
    "action": {
      "fill": "Llenar formulario"
    },
    "formClosedTip": "Este Formulario está cerrado. No se puede descargar y no acepta envíos.",
    "formClosingTip": "Este Formulario se está cerrando. No se puede descargar, pero aún acepta Envíos.",
    "formUnpublishedTip": "Este Formulario aún no tiene una versión publicada."
  },
  "fr": {
    "lastSubmission": "(dernière {dateTime})",
    "action": {
      "fill": "Remplir le formulaire"
    },
    "formClosedTip": "Ce formulaire est fermé. Il n'est plus téléchargeable et n'accepte plus de soumissions.",
    "formClosingTip": "Ce formulaire est en cours de fermeture. Il n'est plus téléchargeable mais peut toujours recevoir des soumissions.",
    "formUnpublishedTip": "Ce formulaire ne dispose pas encore de version publiée."
  },
  "id": {
    "lastSubmission": "(terakhir {dateTime})",
    "action": {
      "fill": "Isi Formulir"
    }
  },
  "ja": {
    "lastSubmission": "（最終提出日時 {dateTime}）",
    "action": {
      "fill": "フォームに記入"
    },
    "formClosedTip": "このフォームは終了しています。ダウンロードやフォームの提出は出来ません。",
    "formClosingTip": "このフォームはクロージング状態です。ダウンロードは出来ませんが、フォームの提出は受け付けています。",
    "formUnpublishedTip": "このフォームは公開バージョンがまだありません。"
  }
}
</i18n>
