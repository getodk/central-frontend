<template>
  <div id="entity-upload-errors">
    <p class="entity-upload-section-title">{{ $tcn('title', count) }}</p>
    <p>{{ $t('introduction') }}</p>
    <i18n-t v-if="delimiter !== ','" tag="p" keypath="delimiterNotComma">
      <template #delimiter>
        <code>{{ formattedDelimiter }}</code>
      </template>
    </i18n-t>

    <entity-upload-alert v-if="invalidQuotes" type="danger">
      <template #title>{{ $t('invalidQuotes.title') }}</template>
      <template #body>
        <p>{{ $t('invalidQuotes.description') }}</p>
      </template>
    </entity-upload-alert>
    <entity-upload-alert v-if="missingLabel" type="danger">
      <template #title>
        <i18n-t keypath="missingLabel.title">
          <template #label>
            <span class="text-monospace">label</span>
          </template>
        </i18n-t>
      </template>
      <template #body>
        <p>{{ $t('missingLabel.description') }}</p>
      </template>
    </entity-upload-alert>
    <entity-upload-alert v-if="duplicateColumns != null" type="danger">
      <template #title>{{ $t('duplicateColumn.title') }}</template>
      <template #body>
        <p>
          <span>{{ $t('duplicateColumn.description') }}</span>
          <sentence-separator/>
          <span>{{ $tc('duplicateColumn.headersReused', duplicateColumns.length) }}</span>
        </p>
        <entity-upload-property-list :names="duplicateColumns"/>
      </template>
    </entity-upload-alert>
    <entity-upload-alert v-if="emptyColumn" type="danger">
      <template #title>{{ $t('emptyColumn.title') }}</template>
      <template #body>
        <p>{{ $t('emptyColumn.description') }}</p>
      </template>
    </entity-upload-alert>

    <entity-upload-alert v-if="dataError != null" type="danger">
      <template #title>{{ $t('dataError') }}</template>
      <template #body>
        <p>{{ dataError }}</p>
      </template>
    </entity-upload-alert>
    <entity-upload-alert v-if="unknownEntities != null" type="danger"
      :ranges="unknownRanges" @rows="$emit('rows', $event)">
      <template #title>{{ $t('unknownEntities.title') }}</template>
      <template #body>
        <p>{{ $t('unknownEntities.description') }}</p>
      </template>
    </entity-upload-alert>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import EntityUploadAlert from './alert.vue';
import EntityUploadPropertyList from './property-list.vue';
import SentenceSeparator from '../../sentence-separator.vue';

import { formatCSVDelimiter } from '../../../util/csv';

defineOptions({
  name: 'EntityUploadErrors'
});
const props = defineProps({
  delimiter: {
    type: String,
    required: true
  },
  // Number of errors
  count: {
    type: Number,
    required: true
  },

  // Errors about the column header
  invalidQuotes: Boolean,
  missingLabel: Boolean,
  duplicateColumns: Array,
  emptyColumn: Boolean,

  // Error in the data below the column header
  dataError: String,
  unknownEntities: Map,
});
defineEmits(['rows']);

const formattedDelimiter = computed(() => formatCSVDelimiter(props.delimiter));

const unknownRanges = computed(() => [...props.unknownEntities.values()]
  .sort(([row1], [row2]) => row1 < row2));
</script>

<style lang="scss">
@import '../../../assets/scss/variables';

#entity-upload-errors {
  margin-bottom: 20px;

  code { border: 1px solid $color-text; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This text is shown above a section that lists errors in the user's data.
    "title": "Review {count} error | Review {count} errors",
    "introduction": "Errors must be fixed before you can upload Entities.",
    "delimiterNotComma": "These errors may be because we got the cell delimiter wrong. We used {delimiter}.",

    "invalidQuotes": {
      "title": "A quoted field is invalid in the header row",
      "description": "Check the header row of your file to see if there are any unusual values."
    },
    "missingLabel": {
      // {label} will have the text "label" and refers to the "label" property.
      // The name of the property is not translated.
      "title": "A {label} property is required for new Entities",
      "description": "The label indicates the name to use for each Entity throughout Central and elsewhere."
    },
    "duplicateColumn": {
      "title": "Duplicate column headers",
      "description": "Each column must have a unique header.",
      // This text is followed by a list of column headers.
      "headersReused": "This header is used more than once: | These headers are used more than once:"
    },
    "emptyColumn": {
      "title": "Empty cell in header row",
      "description": "Please remove any empty columns in your file."
    },

    // @transifexKey component.EntityUploadDataError.title
    "dataError": "Data error",
    "unknownEntities": {
      // This text is followed by a list of one or more rows.
      "title": "Some rows contain Entity IDs that were not found in the Entity List:",
      "description": "These Entities cannot be updated. To proceed, either remove these Entities from the file, or ensure that they exist in the Entity List."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "title": "{count} Fehler prüfen | {count} Fehler prüfen",
    "introduction": "Die Fehler müssen behoben sein, bevor Sie Objekte hochladen können.",
    "delimiterNotComma": "Diese Fehler können daher kommen, dass das Trennzeichen falsch erkannt wurde. Verwendet wurde {delimiter}.",
    "invalidQuotes": {
      "title": "Ein Feld in Anführungszeichen in der Kopfzeile ist ungültig",
      "description": "Prüfen Sie die Kopfzeile Ihrer Datei auf ungewöhnliche Werte."
    },
    "missingLabel": {
      "description": "Das Label ist der Name, unter dem jedes Objekt in Central und anderswo angezeigt wird."
    },
    "duplicateColumn": {
      "title": "Doppelte Spaltenüberschriften",
      "description": "Jede Spalte braucht eine eigene Überschrift.",
      "headersReused": "Diese Überschrift kommt mehr als einmal vor: | Diese Überschriften kommen mehr als einmal vor:"
    },
    "emptyColumn": {
      "title": "Leere Zelle in der Kopfzeile",
      "description": "Bitte entfernen Sie leere Spalten aus Ihrer Datei."
    },
    "dataError": "Datenfehler"
  },
  "es": {
    "introduction": "Es necesario corregir los errores antes de poder subir entidades.",
    "invalidQuotes": {
      "title": "Un campo entre comillas no es válido en la fila de encabezado",
      "description": "Comprueba la fila de encabezado de tu archivo para ver si hay algún valor inusual."
    },
    "missingLabel": {
      "description": "La etiqueta indica el nombre que debe utilizarse para cada entidad, tanto en Central como en cualquier otro lugar."
    },
    "duplicateColumn": {
      "title": "Encabezados de columna duplicados",
      "description": "Cada columna debe tener un encabezado único.",
      "headersReused": "Este encabezado se utiliza más de una vez: | Estas cabeceras se utilizan más de una vez: | Estas cabeceras se utilizan más de una vez:"
    },
    "emptyColumn": {
      "title": "Celdilla vacía en la fila de encabezado",
      "description": "Por favor, elimina todas las columnas vacías de tu archivo."
    },
    "dataError": "Error de datos"
  },
  "fr": {
    "title": "Vérifier {count} erreur | Vérifier {count} erreurs | Vérifier {count} erreurs",
    "introduction": "Les erreurs doivent être corrigées avant de pouvoir importer les entités.",
    "delimiterNotComma": "Ces erreurs peuvent être parce que nous avons mal défini le délimiteur de cellule. Nous avons utilisé {delimiter}.",
    "invalidQuotes": {
      "title": "Un champ entre guillemets est invalide dans la ligne d'en-tête.",
      "description": "Vérifiez la ligne d'en-tête de votre fichier pour voir si elle contient des valeurs inhabituelles."
    },
    "missingLabel": {
      "title": "Une propriété {label} est requise pour les nouvelles entités.",
      "description": "L'étiquette (label) indique le nom à utiliser pour chaque entité dans Central et ailleurs."
    },
    "duplicateColumn": {
      "title": "En-têtes de colonne en double",
      "description": "Chaque colonne dot avoir une en-tête unique.",
      "headersReused": "Cette en-têtes est utilisée plus qu'une fois: | Ces en-têtes sont utilisées plus qu'une fois: | Ces en-têtes sont utilisées plus qu'une fois:"
    },
    "emptyColumn": {
      "title": "Cellule vide dans la ligne d'en-tête",
      "description": "Veuillez supprimer toutes les colonnes vides de votre fichier."
    },
    "dataError": "Erreur de données"
  },
  "it": {
    "title": "Controlla {count} errore | Controlla {count} errori | Controlla {count} errori",
    "introduction": "Devi correggere gli errori prima di poter caricare le entità.",
    "delimiterNotComma": "Questi errori potrebbero dipendere da un delimitatore di cella sbagliato. Abbiamo usato {delimiter}.",
    "invalidQuotes": {
      "title": "Campo tra virgolette non valido nella riga di intestazione",
      "description": "Controlla se nella riga di intestazione del file ci sono valori insoliti."
    },
    "missingLabel": {
      "description": "L'etichetta indica il nome da usare per ogni entità in Central e altrove."
    },
    "duplicateColumn": {
      "title": "Intestazioni di colonna duplicate",
      "description": "Ogni colonna deve avere un'intestazione univoca.",
      "headersReused": "Questa intestazione è usata più di una volta: | Queste intestazioni sono usate più di una volta: | Queste intestazioni sono usate più di una volta:"
    },
    "emptyColumn": {
      "title": "Cella vuota nella riga di intestazione",
      "description": "Rimuovi le eventuali colonne vuote dal file."
    },
    "dataError": "Errore dati"
  },
  "pt": {
    "dataError": "Erro de dados"
  },
  "zh": {
    "title": "查看 {count} 个错误",
    "introduction": "请先修复错误，再上传实体。",
    "delimiterNotComma": "这些错误可能是因为单元格分隔符设置不正确。目前使用的是 {delimiter}",
    "invalidQuotes": {
      "title": "表头行中的带引号字段无效",
      "description": "检查文件的表头行，查看是否有异常值。"
    },
    "missingLabel": {
      "description": "此标签表示每个实体在 Central 及其他地方的名称。"
    },
    "duplicateColumn": {
      "title": "重复的列标题",
      "description": "每一列必须有唯一的标题。",
      "headersReused": "以下标题被多次使用："
    },
    "emptyColumn": {
      "title": "标题行中的单元格为空",
      "description": "请删除文件中的所有空列。"
    },
    "dataError": "数据错误"
  },
  "zh-Hant": {
    "title": "檢查{count}個錯誤",
    "introduction": "您必須先修正錯誤，才能上傳實體。",
    "delimiterNotComma": "這些錯誤可能是因為系統判斷的儲存格分隔符號有誤。我們使用的是 {delimiter}。",
    "invalidQuotes": {
      "title": "標題列中有一個加上引號的欄位無效",
      "description": "請檢查檔案的標題列中是否有任何異常值。"
    },
    "missingLabel": {
      "description": "標籤用於指定每個實體在 Central 及其他地方顯示的名稱。"
    },
    "duplicateColumn": {
      "title": "欄位標題重複",
      "description": "每一欄都必須有唯一的標題。",
      "headersReused": "以下標題重複使用："
    },
    "emptyColumn": {
      "title": "標題列中有空白儲存格",
      "description": "請移除檔案中的所有空白欄。"
    },
    "dataError": "資料錯誤"
  }
}
</i18n>
