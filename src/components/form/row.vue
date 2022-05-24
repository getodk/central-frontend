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
        {{ form.nameOrId() }}
      </link-if-can>
    </td>

    <td v-for="reviewState of visibleReviewStates" :key="reviewState" class="review-state">
      <template v-if="form.publishedAt != null">
        <link-if-can :to="formPath(form.projectId,form.xmlFormId,`submissions?reviewState=${urlFilterEncode.get(reviewState)}`)"
          :title="$t(`reviewState.${reviewState}`)">
          <span>{{ $n(form.reviewStates[reviewState], 'default') }}</span>
          <span :class="reviewStateIcon(reviewState)"></span>
        </link-if-can>
      </template>
    </td>

    <template v-if="form.publishedAt != null">
      <td class="last-submission">
        <template v-if="form.lastSubmission != null">
          <link-if-can :to="formPath(form.projectId,form.xmlFormId,`submissions`)"
            :title="$t('header.lastSubmission')">
            <date-time :iso="form.lastSubmission" relative="past"/>
            <span class="icon-clock-o"></span>
          </link-if-can>
        </template>
        <template v-else>{{ $t('submission.noSubmission') }}</template>
      </td>
      <td class="total-submissions">
        <link-if-can :to="formPath(form.projectId,form.xmlFormId,`submissions`)"
          :title="$t('common.total')">
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
          <span :title="$t('formClosingTip')">
          <span class="icon-clock-o closing-icon"></span>
          <span>{{ $t('formState.closing') }}</span>
          </span>
        </template>
        <template v-else-if="form.publishedAt != null">
          <enketo-preview v-if="project.permits('project.update')"
            :form-version="form"/>
          <enketo-fill v-else :form-version="form">
            <span class="icon-edit"></span>{{ $t('action.fill') }}
          </enketo-fill>
        </template>
        <template v-else>
          <router-link :to="draftTestingPath" class="btn btn-default">
            <span class="icon-pencil"></span>
            <span>{{ $t('action.test') }}</span>
          </router-link>
         </template>
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
import useReviewState from '../../composables/review-state';


export default {
  name: 'FormRow',
  components: { DateTime, EnketoFill, EnketoPreview, LinkIfCan },
  mixins: [routes()],
  props: {
    form: {
      type: Form,
      required: true
    },
    showActions: {
      type: Boolean,
      default: true
    }
  },
  setup() {
    const { reviewStateIcon } = useReviewState();
    return { reviewStateIcon };
  },
  computed: {
    // The component assumes that this data will exist when the component is
    // created.
    ...requestData(['project']),
    visibleReviewStates: () => ['received', 'hasIssues', 'edited'],
    urlFilterEncode() {
      return new Map()
        .set('received', 'null')
        .set('hasIssues', '%27hasIssues%27')
        .set('edited', '%27edited%27');
    },
    draftTestingPath() {
      return this.formPath(
        this.form.projectId,
        this.form.xmlFormId,
        'draft/testing'
      );
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

  .review-state, .total-submissions, .not-published {
    a { @include text-link; }
    text-align: right;
    width: 100px;
    & [class*='icon'] {
      margin-left: 5px;
      color: #888;
    }
  }

  .actions {
    width: 100px,
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
      "fill": "Fill Form",
      // This appears on a button linking to the draft testing form page
      "test": "Test"
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
    "formClosedTip": "Tento formulář je uzavřen. Nelze jej stáhnout a nepřijímá příspěvky.",
    "formClosingTip": "Tento formulář se uzavírá. Nelze jej stáhnout, ale stále přijímá příspěvky.",
    "formUnpublishedTip": "Tento formulář dosud nemá publikovanou verzi."
  },
  "de": {
    "action": {
      "fill": "Formular ausfüllen"
    },
    "formClosedTip": "Dieses Formular ist geschlossen. Es kann nicht heruntergeladen werden und Übermittlungen werden nicht akzeptiert.",
    "formClosingTip": "Dieses Formular steht auf Schließen. Es kann nicht heruntergeladen werden, aber Übermittlungen werden noch akzeptiert.",
    "formUnpublishedTip": "Es gibt bisher noch keine veröffentlichte Version dieses Formulars."
  },
  "es": {
    "action": {
      "fill": "Llenar formulario"
    },
    "formClosedTip": "Este Formulario está cerrado. No se puede descargar y no acepta envíos.",
    "formClosingTip": "Este Formulario se está cerrando. No se puede descargar, pero aún acepta Envíos.",
    "formUnpublishedTip": "Este Formulario aún no tiene una versión publicada."
  },
  "fr": {
    "action": {
      "fill": "Remplir le formulaire"
    },
    "formClosedTip": "Ce formulaire est fermé. Il n'est plus téléchargeable et n'accepte plus de soumissions.",
    "formClosingTip": "Ce formulaire est en cours de fermeture. Il n'est plus téléchargeable mais peut toujours recevoir des soumissions.",
    "formUnpublishedTip": "Ce formulaire ne dispose pas encore de version publiée."
  },
  "id": {
    "action": {
      "fill": "Isi Formulir"
    },
    "formClosedTip": "Formulir ini telah tertutup. Formulir tidak dapat diunduh dan tidak menerima kiriman.",
    "formClosingTip": "Formulir ini telah ditutup. Formulir tidak dapat diunduh namun tetap dapat menerima kiriman.",
    "formUnpublishedTip": "Formulir ini belum memiliki versi yang dipublikasikan."
  },
  "it": {
    "action": {
      "fill": "Compila il Formulario"
    },
    "formClosedTip": "Questo Formulario è chiuso. Non è scaricabile e non accetta Invii.",
    "formClosingTip": "Questo Formulario è in fase di chiusura. Non è scaricabile e ma tuttavia accetta Invii.",
    "formUnpublishedTip": "Questo formulario non ha ancora una versione pubblicata."
  },
  "ja": {
    "action": {
      "fill": "フォームに記入"
    },
    "formClosedTip": "このフォームは終了しています。ダウンロードやフォームの提出は出来ません。",
    "formClosingTip": "このフォームはクロージング状態です。ダウンロードは出来ませんが、フォームの提出は受け付けています。",
    "formUnpublishedTip": "このフォームは公開バージョンがまだありません。"
  },
  "sw": {
    "action": {
      "fill": "Jaza Fomu"
    },
    "formClosedTip": "Fomu Hii Imefungwa. Haiwezi kupakuliwa na haikubali Mawasilisho.",
    "formClosingTip": "Fomu Hii Inafungwa. Haiwezi kupakuliwa lakini bado inakubali Mawasilisho.",
    "formUnpublishedTip": "Fomu hii bado haina toleo lililochapishwa."
  }
}
</i18n>
