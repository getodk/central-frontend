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
  <tr :class="htmlClass">
    <td class="form-attachment-list-type">{{ type }}</td>
    <td :title="attachment.name" class="form-attachment-list-name">
      <a v-if="attachment.blobExists" :href="href" target="_blank">
        {{ attachment.name }}
      </a>
      <template v-else>
        {{ attachment.name }}
      </template>
    </td>
    <td class="form-attachment-list-uploaded">
      <template v-if="attachment.datasetExists">
        <span class="icon-link"></span>
        <i18n-t tag="span" keypath="linkedToDataset" class="dataset-label">
          <template #datasetName>
            <a :href="datasetLink" target="_blank">{{ datasetName }}</a>
          </template>
        </i18n-t>
        <span v-show="targeted" class="label label-primary">
          {{ $t('override') }}
        </span>
      </template>
      <template v-else-if="attachment.blobExists">
        <date-time :iso="attachment.updatedAt"/>
        <span v-show="targeted" class="label label-primary">
          {{ $t('replace') }}
        </span>
      </template>
      <template v-else>
        <span class="icon-exclamation-triangle"></span>
        <span :title="$t('notUploaded.title')">
          {{ $t('notUploaded.text') }}
        </span>
      </template>
    </td>
    <td class="form-attachment-list-action">
      <div>
        <template v-if="attachment.datasetExists">
          {{ $t('uploadToOverride') }}
        </template>
        <template v-else-if="linkable && !attachment.datasetExists">
          <button type="button" class="btn btn-primary btn-link-dataset"
            @click="$emit('link', { name: attachment.name, blobExists: attachment.blobExists })">
          <span class="icon-link"></span>
          <i18n-t keypath="action.linkDataset">
            <template #datasetName>{{ datasetName }}</template>
          </i18n-t>
        </button>
      </template>
    </div>
    </td>
  </tr>
</template>

<script>
import DateTime from '../date-time.vue';
import { apiPaths } from '../../util/request';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormAttachmentRow',
  components: { DateTime },
  props: {
    attachment: {
      type: Object,
      required: true
    },
    fileIsOverDropZone: {
      type: Boolean,
      default: false
    },
    dragoverAttachment: Object, // eslint-disable-line vue/require-default-prop
    plannedUploads: {
      type: Array,
      required: true
    },
    updatedAttachments: {
      type: Set,
      required: true
    },
    linkable: {
      type: Boolean,
      default: false
    }
  },
  emits: ['link'],
  setup() {
    // The component assumes that this data will exist when the component is
    // created.
    const { form } = useRequestData();
    return { form };
  },
  computed: {
    targeted() {
      const targetedByDragover = this.dragoverAttachment != null &&
        this.attachment.name === this.dragoverAttachment.name;
      const targetedByDrop = this.plannedUploads
        .some(({ attachment }) => attachment.name === this.attachment.name);
      return targetedByDragover || targetedByDrop;
    },
    htmlClass() {
      const dragoverTargetsADifferentRow = this.dragoverAttachment != null &&
        this.dragoverAttachment.name !== this.attachment.name;
      const highlightedAsInfo = this.targeted ||
        (this.fileIsOverDropZone && !dragoverTargetsADifferentRow);
      const highlightedAsSuccess = this.updatedAttachments.has(this.attachment.name);
      return {
        'form-attachment-row': true,
        info: highlightedAsInfo,
        targeted: this.targeted,
        success: highlightedAsSuccess
      };
    },
    type() {
      const { type } = this.attachment;
      if (!/^\w+$/.test(type)) return type;
      const path = `type.${type}`;
      return this.$te(path, this.$i18n.fallbackLocale) ? this.$t(path) : type;
    },
    href() {
      return apiPaths.formDraftAttachment(
        this.form.projectId,
        this.form.xmlFormId,
        this.attachment.name
      );
    },
    datasetName() {
      return this.attachment.name.replace(/.csv$/i, '');
    },
    datasetLink() {
      return apiPaths.entities(this.form.projectId, this.datasetName);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#form-attachment-list-table {
  > tbody > tr {
    &.targeted {
      > td {
        box-shadow: inset 0 1px $color-info, inset 0 -1px $color-info;

        &:first-child {
          box-shadow: inset 1px 1px $color-info, inset 0 -1px $color-info;
        }

        &:last-child {
          box-shadow: inset 0 1px $color-info, inset -1px -1px $color-info;
        }
      }
    }

    .label {
      margin-left: 5px;
    }

    .icon-exclamation-triangle {
      color: #e1bf50;
      margin-right: $margin-right-icon;

      + span {
        cursor: help;
      }
    }

    .form-attachment-list-uploaded{
      .icon-link {
        margin-right: $margin-right-icon;
        color: $color-action-foreground;
      }
    }

    .form-attachment-list-action {

      div {
        text-align: right;
        width: 200px;

        button {
          // adjusting for td padding
          margin-top: -8px;
          margin-bottom: -4px;
        }
      }

    }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is a type of Form Attachment.
    "type": {
      "image": "Image",
      "audio": "Audio",
      "video": "Video",
      "file": "Data File"
    },
    // This is a label that is shown next to a Form Attachment that would be replaced
    // if the selected files were uploaded.
    "replace": "Replace",
    "notUploaded": {
      // This is shown for a Media File that has not been uploaded.
      "text": "Not yet uploaded",
      "title": "To upload files, drag and drop one or more files onto this page"
    },
    // This is shown for a Form Attachment that is linked to a Dataset
    "linkedToDataset": "Linked to Dataset {datasetName}",
    "uploadToOverride": "Upload a file to override.",
    "action": {
      "linkDataset": "Link Dataset {datasetName}"
    },
    // This is a label that is shown next to a Form Attachment that is linked to a Dataset,
    // which would be overriden if the selected files were uploaded.
    "override": "Override"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "type": {
      "image": "Obrázek",
      "audio": "Zvuk",
      "video": "Video",
      "file": "Datový soubor"
    },
    "replace": "Nahradit",
    "notUploaded": {
      "text": "Nebyl nahrán",
      "title": "Chcete-li nahrát soubory, přetáhněte jeden nebo více souborů na tuto stránku"
    },
    "uploadToOverride": "Nahrajte soubor, který chcete přepsat."
  },
  "de": {
    "type": {
      "image": "Bild",
      "audio": "Audio",
      "video": "Video",
      "file": "Daten-Datei"
    },
    "replace": "Ersetzen",
    "notUploaded": {
      "text": "Noch nicht hochgeladen",
      "title": "Um eine oder mehrere Dateien hochzuladen, verwenden Sie Drag-and-Drop auf diese Seite"
    }
  },
  "es": {
    "type": {
      "image": "Imagen",
      "audio": "Audio",
      "video": "Video",
      "file": "Archivo de datos"
    },
    "replace": "Reemplazar",
    "notUploaded": {
      "text": "Aún no cargado",
      "title": "Para cargar archivos, arrastre y suelte uno o más archivos en esta página."
    }
  },
  "fr": {
    "type": {
      "image": "Image",
      "audio": "Audio",
      "video": "Vidéo",
      "file": "Fichier de données"
    },
    "replace": "Remplacer",
    "notUploaded": {
      "text": "Non encore téléversé",
      "title": "Pour téléverser des fichiers, glissez/déposer un ou plusieurs fichiers sur le tableau de cette page."
    },
    "linkedToDataset": "Lié au Dataset {datasetName}",
    "uploadToOverride": "Envoyer un fichier pour écraser.",
    "override": "Écraser"
  },
  "id": {
    "type": {
      "image": "Gambar",
      "audio": "Audio",
      "video": "Video",
      "file": "File Data"
    },
    "replace": "Ganti",
    "notUploaded": {
      "text": "Belum terunggah",
      "title": "Untuk menunggah dokumen, seret dan lepas satu atau lebih dokumen ke laman ini"
    }
  },
  "it": {
    "type": {
      "image": "File immagine",
      "audio": "Audio",
      "video": "Video",
      "file": "File dati"
    },
    "replace": "Rimpiazzare",
    "notUploaded": {
      "text": "Non ancora caricato",
      "title": "Per caricare file, trascina e rilascia uno o più file su questa pagina"
    }
  },
  "ja": {
    "type": {
      "image": "画像",
      "audio": "音声",
      "video": "ビデオ",
      "file": "データファイル"
    },
    "replace": "置換",
    "notUploaded": {
      "text": "アップロード未完了",
      "title": "１つ以上のファイルをドラッグ＆ドロップしてアップロードする。"
    }
  },
  "sw": {
    "type": {
      "image": "Picha",
      "audio": "Sauti",
      "video": "Video",
      "file": "Faili ya Data"
    },
    "replace": "Badilisha",
    "notUploaded": {
      "text": "Bado haijapakiwa",
      "title": "Ili kupakia faili, buruta na udondoshe faili moja au zaidi kwenye ukurasa huu"
    }
  }
}
</i18n>
