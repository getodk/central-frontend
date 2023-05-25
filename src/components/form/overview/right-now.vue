<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <page-section id="form-overview-right-now"
    :class="{ 'open-form': form.state === 'open' }">
    <template #heading>
      <span>{{ $t('common.rightNow') }}</span>
    </template>
    <template #body>
      <summary-item icon="file-o">
        <template #heading>
          <form-version-string :version="form.version"/>
        </template>
        <template #body>
          <i18n-t tag="p" keypath="version.full">
            <template #publishedVersion>
              <strong>{{ $t('version.publishedVersion') }}</strong>
            </template>
          </i18n-t>
          <div>
            <form-version-standard-buttons :version="form" @view-xml="$emit('view-xml')"/>
          </div>
        </template>
      </summary-item>
      <summary-item id="form-overview-right-now-state" :icon="stateIcon">
        <template #heading>
          {{ $t(`formState.${form.state}`) }}
        </template>
        <template #body>
          <p>{{ $t(`stateCaption.${form.state}`) }}</p>
        </template>
      </summary-item>
      <dataset-summary v-if="form.dataExists && form.entityRelated"
        :project-id="form.projectId"
        :xml-form-id="form.xmlFormId"/>
      <summary-item v-if="linkedDatasets.length > 0" id="form-overview-right-now-linked-datasets" icon="link">
        <template #heading>
          {{ linkedDatasets.length }}
        </template>
        <template #body>
          <p>{{ $tc('datasetsLinked', linkedDatasets.length) }}</p>
          <table v-if="linkedDatasets.length > 0" class="table">
            <tbody>
              <tr v-for="(dataset) in linkedDatasets" :key="dataset">
                <td>
                  <router-link :to="datasetPath(form.projectId, dataset)" v-tooltip.text>
                    {{ dataset }}
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </summary-item>
      <summary-item id="form-overview-right-now-submissions"
        :to="formPath('submissions')" icon="inbox">
        <template #heading>
          {{ $n(form.submissions, 'default') }}
          <span class="icon-angle-right"></span>
        </template>
        <template #body>
          <i18n-t tag="p" keypath="submissions.full" :plural="form.submissions">
            <template #submissions>
              <strong>{{ $tc('submissions.submissions', form.submissions) }}</strong>
            </template>
          </i18n-t>
        </template>
      </summary-item>
    </template>
  </page-section>
</template>

<script>
import FormVersionStandardButtons from '../../form-version/standard-buttons.vue';
import FormVersionString from '../../form-version/string.vue';
import PageSection from '../../page/section.vue';
import SummaryItem from '../../summary-item.vue';
import DatasetSummary from '../../dataset/summary.vue';

import useRoutes from '../../../composables/routes';
import { useRequestData } from '../../../request-data';

export default {
  name: 'FormOverviewRightNow',
  components: {
    FormVersionStandardButtons,
    FormVersionString,
    PageSection,
    SummaryItem,
    DatasetSummary
  },
  emits: ['view-xml'],
  setup() {
    // The component assumes that this data will exist when the component is
    // created.
    const { form, publishedAttachments, formDatasetDiff } = useRequestData();
    const { formPath, datasetPath } = useRoutes();
    return {
      form, publishedAttachments, formDatasetDiff,
      formPath, datasetPath
    };
  },
  computed: {
    stateIcon() {
      switch (this.form.state) {
        case 'open':
          return 'exchange';
        case 'closing':
          return 'clock-o';
        default: // 'closed'
          return 'ban';
      }
    },
    linkedDatasets() {
      return this.publishedAttachments.dataExists ? this.publishedAttachments.filter(a => a.datasetExists).map(a => a.name.replace(/.csv$/i, '')) : [];
    }
  }
};
</script>

<style lang="scss">
#form-overview-right-now {

  .open-form {
    .icon-file-o,
    .icon-inbox {
      margin-left: 4px;
      margin-right: 4px;
    }
  }

  #form-overview-right-now-linked-datasets {
    p {
      margin: 0;
    }

    td {
      padding-left: 0px;
    }

    .table > tbody > tr:first-child > td {
      border-top: none;
    }
    a {
      font-size: 18px;
      font-weight: bold;
    }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "version": {
      "full": "{publishedVersion} of this Form.",
      "publishedVersion": "Published version"
    },
    "stateCaption": {
      "open": "This Form is downloadable and is accepting Submissions.",
      "closing": "This Form is not downloadable but still accepts Submissions.",
      "closed": "This Form is not downloadable and does not accept Submissions."
    },
    "submissions": {
      // The count of Submissions is shown separately above this text.
      "full": "{submissions} has been saved for this Form. | {submissions} have been saved for this Form.",
      "submissions": "Submission | Submissions"
    },
    // The count of Dataset(s) is shown separately above this text.
    "datasetsLinked": "Dataset attached to this Form: | Datasets attached to this Form:"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "version": {
      "full": "{publishedVersion} tohoto formuláře.",
      "publishedVersion": "Publikovaná verze"
    },
    "stateCaption": {
      "open": "Tento formulář je ke stažení a přijímá příspěvky.",
      "closing": "Tento formulář nelze stáhnout, ale stále přijímá příspěvky.",
      "closed": "Tento formulář nelze stáhnout a nepřijímá příspěvky."
    },
    "submissions": {
      "full": "{submissions} byl pro tento formulář uložen. | {submissions} byly pro tento formulář uloženy. | {submissions} bylo pro tento formulář uloženo. | {submissions} bylo pro tento formulář uloženo.",
      "submissions": "Příspěvek | Příspěvky | Příspěvků | Příspěvků"
    }
  },
  "de": {
    "version": {
      "full": "{publishedVersion} von diesem Formular.",
      "publishedVersion": "Veröffentlichte Version"
    },
    "stateCaption": {
      "open": "Dieses Formular kann heruntergeladen werden und Übermittlungen werden akzeptiert.",
      "closing": "Dieses Formular kann nicht heruntergeladen werden, aber Übermittlungen werden noch akzeptiert.",
      "closed": "Dieses Formular kann nicht heruntergeladen werden und Übermittlungen werden nicht akzeptiert."
    },
    "submissions": {
      "full": "{submissions} wurde für dieses Formular gespeichert. | {submissions} wurden für dieses Formular gespeichert.",
      "submissions": "Übermittlung | Übermittlungen"
    },
    "datasetsLinked": "An dieses Formular angehängter Datensatz: | Diesem Formular beigefügte Datensätze:"
  },
  "es": {
    "version": {
      "full": "{publishedVersion} de este formulario.",
      "publishedVersion": "Versión publicada"
    },
    "stateCaption": {
      "open": "Este formulario se puede descargar y acepta envíos.",
      "closing": "Este formulario no se puede descargar perro acepta envíos.",
      "closed": "Este formulario no se puede descargar y no acepta envíos."
    },
    "submissions": {
      "full": "{submissions} ha sido guardada para este formulario | {submissions} han sido guardadas para este formulario. | {submissions} han sido guardadas para este formulario.",
      "submissions": "Envío | Envíos | Envíos"
    },
    "datasetsLinked": "Conjunto de datos adjunto a este formulario: | Conjuntos de datos adjuntos a este formulario: | Conjuntos de datos adjuntos a este formulario:"
  },
  "fr": {
    "version": {
      "full": "{publishedVersion} de ce formulaire.",
      "publishedVersion": "Version publiée"
    },
    "stateCaption": {
      "open": "Ce formulaire est téléchargeable et accepte les soumissions.",
      "closing": "Ce formulaire n'est pas téléchargeable mais accepte tout de même les soumissions.",
      "closed": "Ce formulaire n'est pas téléchargeable mais accepte tout de même les soumissions."
    },
    "submissions": {
      "full": "{submissions} a été enregistrées pour ce formulaire. | {submissions} ont été enregistrées pour ce formulaire. | {submissions} ont été enregistrées pour ce formulaire.",
      "submissions": "Soumission | Soumissions | Soumissions"
    },
    "datasetsLinked": "Dataset attaché à ce formulaire | Datasets attachés à ce formulaire | Datasets attachés à ce formulaire"
  },
  "id": {
    "version": {
      "full": "{publishedVersion} dari formulir ini.",
      "publishedVersion": "Versi terbit"
    },
    "stateCaption": {
      "open": "Formulir ini bisa diunduh dan sedang menerima kiriman data.",
      "closing": "Formulir ini tidak bisa diunduh, tetapi masih menerima kiriman data.",
      "closed": "Formulir ini tidak bisa diunduh dan tidak menerima kiriman data."
    },
    "submissions": {
      "full": "{submissions} untuk formulir ini sudah disimpan.",
      "submissions": "Kiriman data"
    }
  },
  "it": {
    "version": {
      "full": "{publishedVersion} di questo formulario.",
      "publishedVersion": "Versione pubblicata"
    },
    "stateCaption": {
      "open": "Questo Formulario è scaricabile e accetta Invii.",
      "closing": "Questo Formulario non è scaricabile e ma tuttavia accetta Invii.",
      "closed": "Questo Formulario non è scaricabile e non accetta Invii."
    },
    "submissions": {
      "full": "{submissions} è stato salvato per questo formulario | {submissions} sono state salvate per questo formulario | {submissions} sono state salvate per questo formulario",
      "submissions": "Invio | Invii | Invii"
    },
    "datasetsLinked": "Il Set di dati è collegato questo formulario: | Set di dati sono collegati questo formulario: | Set di dati sono collegati questo formulario:"
  },
  "ja": {
    "version": {
      "full": "フォームの{publishedVersion}",
      "publishedVersion": "公開バージョン"
    },
    "stateCaption": {
      "open": "このフォームはダウンロードでき、フォームの提出も受け付けています。",
      "closing": "このフォームはダウンロードできませんが、フォームの提出は受け付けています。",
      "closed": "このフォームはダウンロードできませんし、フォームの提出も受け付けていません。"
    },
    "submissions": {
      "full": "このフォームへの{submissions}は保存されました。",
      "submissions": "提出"
    }
  },
  "sw": {
    "version": {
      "full": "{publishedVersion} ya Fomu hii.",
      "publishedVersion": "Toleo lililochapishwa"
    },
    "stateCaption": {
      "open": "Fomu hii inaweza kupakuliwa na inakubali Mawasilisho.",
      "closing": "Fomu hii haiwezi kupakuliwa lakini bado inakubali Mawasilisho.",
      "closed": "Fomu hii haiwezi kupakuliwa na haikubali Mawasilisho."
    },
    "submissions": {
      "full": "{submissions} zimehifadhiwa kwa Fomu hii. | {submissions} zimehifadhiwa kwa Fomu hii.",
      "submissions": "Wasilisho | Mawasilisho"
    },
    "datasetsLinked": "Seti ya data iliyoambatishwa kwenye Fomu hii: | Seti za data zilizoambatishwa kwenye Fomu hii:"
  }
}
</i18n>
