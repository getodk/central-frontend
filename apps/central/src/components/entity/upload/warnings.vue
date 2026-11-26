<!--
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="entity-upload-warnings">
    <p class="entity-upload-section-title">{{ $tcn('title', count) }}</p>
    <p>{{ $t('introduction') }}</p>

    <!-- Column header warnings -->
    <entity-upload-alert v-if="systemProperties != null" type="warning">
      <template #title>{{ $t('systemProperties') }}</template>
      <template #body>
        <p>{{ $tc('propertiesIgnored', systemProperties.length) }}</p>
        <entity-upload-property-list :names="systemProperties"/>
      </template>
    </entity-upload-alert>
    <entity-upload-alert v-if="caseMismatch != null"
      id="entity-upload-warnings-case-mismatch" type="warning">
      <template #title>{{ $t('caseMismatch.title') }}</template>
      <template #body>
        <p>
          <span>{{ $t('caseMismatch.description') }}</span>
          <sentence-separator/>
          <span>{{ $tc('columnsIgnored', caseMismatch.length) }}</span>
        </p>
        <div>
          <table class="table">
            <thead>
              <tr>
                <th>{{ $t('caseMismatch.existingProperty') }}</th>
                <th v-tooltip.text>{{ filename }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="{ column, property } of caseMismatch" :key="column">
                <td v-tooltip.text>{{ property }}</td>
                <td v-tooltip.text>{{ column }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </entity-upload-alert>
    <entity-upload-alert v-if="invalidProperties != null" type="warning">
      <template #title>{{ $tc('invalidProperties', invalidProperties.length) }}</template>
      <template #body>
        <p>{{ $tc('propertiesIgnored', invalidProperties.length) }}</p>
        <entity-upload-property-list :names="invalidProperties"/>
      </template>
    </entity-upload-alert>
    <entity-upload-alert v-if="missingProperties != null" type="warning">
      <template #title>
        {{ $tc('missingProperties.title', missingProperties.length) }}
      </template>
      <template #body>
        <p>{{ $tc('missingProperties.description', missingProperties.length) }}</p>
        <entity-upload-property-list :names="missingProperties"/>
      </template>
    </entity-upload-alert>

    <!-- Data warnings -->
    <entity-upload-alert v-if="raggedRows != null" type="warning"
      :ranges="raggedRows" @rows="$emit('rows', $event)">
      <template #title>{{ $t('row.raggedRows') }}</template>
    </entity-upload-alert>
    <entity-upload-alert v-if="largeCell != null" type="warning"
      :ranges="[[largeCell, largeCell]]" @rows="$emit('rows', $event)">
      <template #title>{{ $t('row.largeCell') }}</template>
    </entity-upload-alert>

    <!-- Extra properties -->
    <entity-upload-alert v-if="extraProperties != null" type="warning">
      <template #title>
        <template v-if="extraProperties.length === 1">
          {{ $t('extraProperties.title.one') }}
        </template>
        <template v-else>
          {{ $t('extraProperties.title.multiple') }}
        </template>
      </template>
      <template #body>
        <p>
          <template v-if="!hasError">
            <template v-if="extraProperties.length === 1">
              {{ $t('extraProperties.description.one') }}
            </template>
            <template v-else>
              {{ $t('extraProperties.description.multiple') }}
            </template>
          </template>
          <template v-else>
            <template v-if="extraProperties.length === 1">
              {{ $t('extraProperties.error.one') }}
            </template>
            <template v-else>
              {{ $t('extraProperties.error.multiple') }}
            </template>
          </template>
        </p>
        <slot name="extra-properties"></slot>
      </template>
    </entity-upload-alert>
  </div>
</template>

<script setup>
import EntityUploadAlert from './alert.vue';
import EntityUploadPropertyList from './property-list.vue';
import SentenceSeparator from '../../sentence-separator.vue';

defineOptions({
  name: 'EntityUploadWarnings'
});
defineProps({
  filename: {
    type: String,
    required: true
  },
  // Number of warnings
  count: {
    type: Number,
    required: true
  },
  hasError: Boolean,

  // Column header warnings
  systemProperties: Array,
  caseMismatch: Array,
  invalidProperties: Array,
  missingProperties: Array,
  extraProperties: Array,

  // Data warnings (below the column header)
  raggedRows: Array,
  largeCell: Number
});
defineEmits(['rows']);
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

#entity-upload-warnings-case-mismatch {
  div:has(> table) {
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 10px;
    padding: 6px;
  }

  table {
    margin-bottom: 0;
    table-layout: fixed;
  }

  thead { background-color: transparent; }
  th, td { @include text-overflow-ellipsis; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // @transifexKey component.EntityUploadHeaderReview.title
    // This text is shown above a section where the user can review warnings
    // about their data.
    "title": "Review {count} warning | Review {count} warnings",
    "introduction": "Some rows contain warnings that may affect upload results.",

    // "Properties" refers to Entity properties.
    "systemProperties": "System properties can’t be set by .csv upload",
    "caseMismatch": {
      // "Property" refers to an Entity property.
      "title": "Column is similar to an existing property but does not match",
      "description": "Column names are case-sensitive. Check the spelling and capitalization.",
      // "Property" refers to an Entity property.
      "existingProperty": "Existing property"
    },
    // "Property" refers to an Entity property.
    "invalidProperties": "This column is not a valid property name | These columns are not valid property names",
    "missingProperties": {
      // "Property" refers to an Entity property.
      "title": "Property not found in file | Properties not found in file",
      // "Property" refers to an Entity property.
      "description": "This property will be left empty for new Entities and unchanged for updated ones. | These properties will be left empty for new Entities and unchanged for updated ones."
    },
    "extraProperties": {
      "title": {
        "one": "Column doesn’t match existing properties",
        "multiple": "These columns don’t match existing properties"
      },
      "description": {
        "one": "Select the column to create a new property, otherwise it will be ignored.",
        // "Ones" refers to "columns".
        "multiple": "Select which ones to create, otherwise they will be ignored."
      },
      "error": {
        "one": "Once you’ve fixed all errors, you’ll be able to select the column.",
        // "Ones" refers to "columns".
        "multiple": "Once you’ve fixed all errors, you’ll be able to select which ones to create."
      }
    },
    // "Property" refers to an Entity property.
    "propertiesIgnored": "This property will be ignored. | These properties will be ignored.",
    "columnsIgnored": "This column will be ignored. | These columns will be ignored.",

    // This is a warning that is followed by a list of rows.
    "row": {
      "raggedRows": "Fewer columns were found than expected in some rows:",
      "largeCell": "Some cells are abnormally large, which can indicate difficulties reading your file:"
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "introduction": "Einige Zeilen enthalten Warnungen, die das Ergebnis des Hochladens beeinflussen können.",
    "systemProperties": "Systemeigenschaften lassen sich nicht per .csv-Datei setzen",
    "caseMismatch": {
      "title": "Die Spalte ähnelt einer vorhandenen Eigenschaft, stimmt aber nicht mit ihr überein",
      "description": "Bei Spaltennamen zählt die Groß- und Kleinschreibung. Prüfen Sie Schreibweise und Großbuchstaben.",
      "existingProperty": "Vorhandene Eigenschaft"
    },
    "invalidProperties": "Diese Spalte ist kein gültiger Eigenschaftsname | Diese Spalten sind keine gültigen Eigenschaftsnamen",
    "missingProperties": {
      "title": "Eigenschaft nicht in der Datei gefunden | Eigenschaften nicht in der Datei gefunden"
    },
    "extraProperties": {
      "title": {
        "one": "Die Spalte passt zu keiner vorhandenen Eigenschaft",
        "multiple": "Diese Spalten passen zu keiner vorhandenen Eigenschaft"
      },
      "description": {
        "one": "Wählen Sie die Spalte aus, um eine neue Eigenschaft anzulegen, sonst wird sie ignoriert.",
        "multiple": "Wählen Sie aus, welche angelegt werden sollen; die übrigen werden ignoriert."
      },
      "error": {
        "one": "Sobald Sie alle Fehler behoben haben, können Sie die Spalte auswählen.",
        "multiple": "Sobald Sie alle Fehler behoben haben, können Sie auswählen, welche angelegt werden sollen."
      }
    },
    "propertiesIgnored": "Diese Eigenschaft wird ignoriert. | Diese Eigenschaften werden ignoriert.",
    "columnsIgnored": "Diese Spalte wird ignoriert. | Diese Spalten werden ignoriert.",
    "row": {
      "raggedRows": "In einigen Zeilen wurden weniger Spalten als erwartet gefunden:",
      "largeCell": "Einige Zellen sind ungewöhnlich groß, was auf Schwierigkeiten beim Lesen Ihrer Datei hinweisen kann:"
    },
    "title": "{count} Warnung prüfen | {count} Warnungen prüfen"
  },
  "es": {
    "introduction": "Algunas filas contienen avisos que pueden afectar a los resultados de la carga.",
    "systemProperties": "Las propiedades del sistema no se pueden configurar mediante la importación de un archivo .csv",
    "caseMismatch": {
      "title": "La columna es similar a una propiedad ya existente, pero no coincide con ella",
      "description": "Los nombres de las columnas distinguen entre mayúsculas y minúsculas. Comprueba la ortografía y el uso de mayúsculas.",
      "existingProperty": "Propiedad existente"
    },
    "invalidProperties": "Esta columna no es un nombre de propiedad válido | Estas columnas no son nombres de propiedades válidos | Estas columnas no son nombres de propiedades válidos",
    "missingProperties": {
      "title": "No se ha encontrado la propiedad en el archivo | No se han encontrado propiedades en el archivo | No se han encontrado propiedades en el archivo"
    },
    "extraProperties": {
      "title": {
        "one": "La columna no coincide con ninguna propiedad existente",
        "multiple": "Estas columnas no coinciden con las propiedades existentes"
      }
    },
    "row": {
      "raggedRows": "Se encontraron menos columnas de las esperadas en algunas filas:",
      "largeCell": "Algunas celdas son anormalmente grandes, lo que puede indicar dificultades para leer su archivo:"
    }
  },
  "fr": {
    "introduction": "Certaines lignes contiennent des avertissements qui pourraient affecter les résultats du chargement.",
    "systemProperties": "Les propriétés système ne peuvent pas être définies par un import de fichier CSV",
    "caseMismatch": {
      "title": "La colonne est similaire à une propriété existante mais ne correspond pas",
      "description": "Les noms de colonnes sont sensibles à la casse. Vérifiez l'orthographe et les majuscules.",
      "existingProperty": "Propriété existante"
    },
    "invalidProperties": "Cette colonne ne constitue pas un nom de propriété valide | Ces colonnes ne constituent pas des noms de propriété valides | Ces colonnes ne constituent pas des noms de propriété valides",
    "missingProperties": {
      "title": "Propriété pas trouvée dans le fichier | Propriétés pas trouvées dans le fichier | Propriétés pas trouvées dans le fichier",
      "description": "Cette propriété restera vide pour les nouvelles entités et inchangée pour les entités mises à jour. | Ces propriétés resteront vides pour les nouvelles entités et inchangées pour les entités mises à jour. | Ces propriétés resteront vides pour les nouvelles entités et inchangées pour les entités mises à jour."
    },
    "extraProperties": {
      "title": {
        "one": "La colonne ne correspond pas aux propriétés existantes",
        "multiple": "Ces colonnes ne correspondent pas aux propriétés existantes"
      },
      "description": {
        "one": "Choisir la colonne pour créer une nouvelle propriété. Autrement, elle sera ignorée.",
        "multiple": "Choisir laquelle créer, autrement elle sera ignorée."
      },
      "error": {
        "one": "Une fois que vous aurez corrigé toutes les erreurs, vous pourrez sélectionner la colonne.",
        "multiple": "Une fois que vous aurez corrigé toutes les erreurs, vous pourrez sélectionner lesquelles créer."
      }
    },
    "propertiesIgnored": "Ces propriétés sera ignorée. | Ces propriétés seront ignorées. | Ces propriétés seront ignorées.",
    "columnsIgnored": "Cette colonne sera ignorée. | Ces colonnes seront ignorées. | Ces colonnes seront ignorées.",
    "row": {
      "raggedRows": "Dans certaines lignes, il y a eu moins de colonnes détectées que prévu:",
      "largeCell": "Certaines cellules sont anormalement larges, ce qui peut indiquer des difficultés à lire votre fichier:"
    },
    "title": "Vérifiez {count} message d'avertissement | Vérifiez {count} messages d'avertissement | Vérifiez {count} messages d'avertissement"
  },
  "it": {
    "introduction": "Alcune righe contengono avvisi che potrebbero influire sul risultato del caricamento.",
    "systemProperties": "Le proprietà di sistema non possono essere impostate con il caricamento di un .csv",
    "caseMismatch": {
      "title": "La colonna è simile a una proprietà esistente ma non corrisponde",
      "description": "I nomi delle colonne distinguono tra maiuscole e minuscole. Controlla l'ortografia e le maiuscole.",
      "existingProperty": "Proprietà esistente"
    },
    "invalidProperties": "Questa colonna non è un nome di proprietà valido | Queste colonne non sono nomi di proprietà validi | Queste colonne non sono nomi di proprietà validi",
    "missingProperties": {
      "title": "Proprietà non trovata nel file | Proprietà non trovate nel file | Proprietà non trovate nel file"
    },
    "extraProperties": {
      "title": {
        "one": "La colonna non corrisponde a nessuna proprietà esistente",
        "multiple": "Queste colonne non corrispondono a nessuna proprietà esistente"
      },
      "description": {
        "one": "Seleziona la colonna per creare una nuova proprietà, altrimenti verrà ignorata.",
        "multiple": "Seleziona quelle da creare, altrimenti verranno ignorate."
      },
      "error": {
        "one": "Dopo aver corretto tutti gli errori, potrai selezionare la colonna.",
        "multiple": "Dopo aver corretto tutti gli errori, potrai selezionare quelle da creare."
      }
    },
    "propertiesIgnored": "Questa proprietà verrà ignorata. | Queste proprietà verranno ignorate. | Queste proprietà verranno ignorate.",
    "columnsIgnored": "Questa colonna verrà ignorata. | Queste colonne verranno ignorate. | Queste colonne verranno ignorate.",
    "row": {
      "raggedRows": "In alcune righe sono state trovate meno colonne del previsto:",
      "largeCell": "Alcune celle sono eccessivamente grandi, il che può indicare difficoltà nella lettura del file:"
    },
    "title": "Controlla {count} avviso | Controlla {count} avvisi | Controlla {count} avvisi"
  },
  "pt": {
    "row": {
      "raggedRows": "Menos colunas foram encontradas do que o esperado em algumas linhas:",
      "largeCell": "Algumas células são anormalmente grandes, o que pode indicar dificuldades na leitura do seu arquivo:"
    }
  },
  "zh": {
    "introduction": "部分行包含可能影响上传结果的警告。",
    "systemProperties": "系统属性无法通过 .csv 上传设置",
    "caseMismatch": {
      "title": "此列与现有属性相似但不匹配",
      "description": "列名区分大小写。请检查拼写和大小写。",
      "existingProperty": "现有属性"
    },
    "invalidProperties": "这些列不是有效的属性名称",
    "missingProperties": {
      "title": "文件中未找到的属性"
    },
    "extraProperties": {
      "title": {
        "one": "列与现有属性不匹配",
        "multiple": "这些列与现有属性不匹配"
      },
      "description": {
        "one": "选择该列以创建新属性，否则该列将被忽略。",
        "multiple": "选择要创建的内容，否则它们将被忽略。"
      },
      "error": {
        "one": "修正所有错误后，您就可以选择该列。",
        "multiple": "修正所有错误后，您就可以选择要创建哪些内容。"
      }
    },
    "propertiesIgnored": "这些属性将被忽略。",
    "columnsIgnored": "这些列将被忽略。",
    "row": {
      "raggedRows": "部分行包含的纵列数少于预期：",
      "largeCell": "部分单元格异常过大，这可能会使文件读取失败："
    },
    "title": "查看 {count} 个警告"
  },
  "zh-Hant": {
    "introduction": "部分資料列含有可能影響上傳結果的警告。",
    "systemProperties": "無法透過 .csv 上傳設定系統屬性",
    "caseMismatch": {
      "title": "此欄與現有屬性相似，但不完全相符",
      "description": "欄位名稱區分大小寫。請檢查拼字和大小寫。",
      "existingProperty": "現有屬性"
    },
    "invalidProperties": "這些欄位名稱不是有效的屬性名稱",
    "missingProperties": {
      "title": "檔案中找不到這些屬性"
    },
    "extraProperties": {
      "title": {
        "one": "欄位與現有屬性不符",
        "multiple": "這些欄位與現有屬性不符"
      },
      "description": {
        "one": "選取此欄位以建立新屬性，否則將會略過。",
        "multiple": "選取要建立的欄位，否則將會略過。"
      },
      "error": {
        "one": "修正所有錯誤後，即可選取此欄位。",
        "multiple": "修正所有錯誤後，即可選取要建立的欄位。"
      }
    },
    "propertiesIgnored": "這些屬性將會被略過。",
    "columnsIgnored": "這些欄位將會被略過。",
    "row": {
      "raggedRows": "在某些行中發現的列數少於預期：",
      "largeCell": "有些儲存格異常大，這可能表示讀取檔案有困難："
    },
    "title": "檢查{count}個警告"
  }
}
</i18n>
