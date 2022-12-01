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
        {{ form.nameOrId }}
      </link-if-can>
      <span v-if="showIdForDuplicateName" class="duplicate-form-id">({{ form.xmlFormId }})</span>
    </td>

    <td v-for="reviewState of visibleReviewStates" :key="reviewState" class="review-state">
      <template v-if="form.publishedAt != null">
        <link-if-can :to="formPath(form.projectId, form.xmlFormId, `submissions?reviewState=${urlFilterEncode.get(reviewState)}`)"
          :title="$t(`reviewState.${reviewState}`)">
          <span>{{ $n(form.reviewStates[reviewState], 'default') }}</span>
          <span :class="reviewStateIcon(reviewState)"></span>
        </link-if-can>
      </template>
    </td>

    <template v-if="form.publishedAt != null">
      <td class="last-submission">
        <span :title="$t('header.lastSubmission')">
          <template v-if="form.lastSubmission != null">
            <link-if-can :to="formPath(form.projectId, form.xmlFormId, `submissions`)">
              <date-time :iso="form.lastSubmission" relative="past"/>
              <span class="icon-clock-o"></span>
            </link-if-can>
          </template>
          <template v-else>{{ $t('submission.noSubmission') }}</template>
        </span>
      </td>
      <td class="total-submissions">
        <link-if-can :to="formPath(form.projectId, form.xmlFormId, `submissions`)"
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

import routes from '../../mixins/routes';
import { useRequestData } from '../../request-data';
import useReviewState from '../../composables/review-state';

export default {
  name: 'FormRow',
  components: { DateTime, EnketoFill, EnketoPreview, LinkIfCan },
  mixins: [routes()],
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
    const { reviewStateIcon } = useReviewState();
    return { project, duplicateFormNames, reviewStateIcon };
  },
  computed: {
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
    },
    showIdForDuplicateName() {
      if (this.duplicateFormNames == null) return false;
      const name = this.form.nameOrId.toLocaleLowerCase();
      return this.duplicateFormNames.has(name);
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
      "fill": "Vyplnit formulář",
      "test": "Test"
    },
    "formClosingTip": "Tento formulář se uzavírá a přijímá poslední podání. Není ke stažení, ale stále přijímá příspěvky."
  },
  "de": {
    "action": {
      "fill": "Formular ausfüllen",
      "test": "testen"
    },
    "formClosingTip": "Dieses Formular steht auf Schliessen und akzeptiert seine endgültigen Übermittlungen. Es kann nicht heruntergeladen werden, aber Übermittlungen werden noch akzeptiert."
  },
  "es": {
    "action": {
      "fill": "Llenar formulario",
      "test": "Probar"
    },
    "formClosingTip": "Este formulario se está cerrando y aceptando sus Envíos finales. No se puede descargar, pero aún acepta Envíos."
  },
  "fr": {
    "action": {
      "fill": "Remplir le formulaire",
      "test": "Test"
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
      "fill": "Compila il Formulario",
      "test": "Test"
    },
    "formClosingTip": "Questo Formulario è in fase di chiusura e accetta i suoi ultimi Invii. Non è scaricabile ma tuttavia accetta Invii."
  },
  "ja": {
    "action": {
      "fill": "フォームに記入"
    }
  },
  "sw": {
    "action": {
      "fill": "Jaza Fomu"
    }
  }
}
</i18n>
