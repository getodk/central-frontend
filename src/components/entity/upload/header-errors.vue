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
  <dl id="entity-upload-header-errors" class="dl-horizontal">
    <dt>{{ $t('expectedHeader') }}</dt>
    <dd>
      <div :ref="setHeaderElement(0)" class="csv-header" @scroll="scrollHeader">
        {{ expectedHeader }}
      </div>
    </dd>

    <dt id="entity-upload-header-errors-filename" v-tooltip.text>
      {{ filename }}
    </dt>
    <dd>
      <div :ref="setHeaderElement(1)" class="csv-header" @scroll="scrollHeader">
        {{ header }}
      </div>
    </dd>

    <dt v-if="hasSuggestion" class="entity-upload-header-errors-suggestions">
      {{ $t('suggestions.title') }}
    </dt>
    <dd v-if="hasSuggestion" class="entity-upload-header-errors-suggestions">
      <p v-if="invalidQuotes">{{ $t('suggestions.invalidQuotes') }}</p>
      <i18n-t v-if="missingLabel" tag="p" keypath="suggestions.missingLabel">
        <template #label>
          <span class="text-monospace">label</span>
        </template>
      </i18n-t>
      <p v-if="unknownProperty">{{ $t('suggestions.unknownProperty') }}</p>
      <p v-if="duplicateColumn">{{ $t('suggestions.duplicateColumn') }}</p>
      <p v-if="emptyColumn">{{ $t('suggestions.emptyColumn') }}</p>
      <i18n-t v-if="delimiter !== ','" tag="p"
        keypath="suggestions.delimiterNotComma">
        <template #delimiter>
          <code>{{ formattedDelimiter }}</code>
        </template>
      </i18n-t>
    </dd>
  </dl>
</template>

<script setup>
import { computed } from 'vue';

import { formatCSVDelimiter, formatCSVRow } from '../../../util/csv';
import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'EntityUploadHeaderErrors'
});
const props = defineProps({
  filename: {
    type: String,
    required: true
  },
  header: {
    type: String,
    required: true
  },
  delimiter: {
    type: String,
    required: true
  },
  // Props for specific errors
  invalidQuotes: Boolean,
  missingLabel: Boolean,
  missingProperty: Boolean,
  unknownProperty: Boolean,
  duplicateColumn: Boolean,
  emptyColumn: Boolean
});

// The component assumes that this data will exist when the component is
// created.
const { dataset } = useRequestData();
const expectedHeader = computed(() => {
  const columns = dataset.properties.map(({ name }) => name);
  columns.unshift('label');
  return formatCSVRow(columns, { delimiter: props.delimiter });
});

const headerElements = [];
const setHeaderElement = (i) => (el) => { headerElements[i] = el; };
const scrollHeader = (event) => {
  const { target } = event;
  for (const header of headerElements) {
    if (header !== target) header.scroll(target.scrollLeft, 0);
  }
};

const hasSuggestion = computed(() => props.delimiter !== ',' ||
  Object.entries(props).some(([name, value]) =>
    // There isn't a suggestion for missing properties.
    value === true && name !== 'missingProperty'));
const formattedDelimiter = computed(() => formatCSVDelimiter(props.delimiter));
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

#entity-upload-header-errors {
  margin-bottom: 0;

  .csv-header {
    @include line-clamp(3);
    font-family: $font-family-monospace;
    overflow-x: auto;
    white-space: break-spaces;
  }
  dd:has(.csv-header) { overflow-x: hidden; }
}

#entity-upload-header-errors-filename { @include text-overflow-ellipsis; }

.entity-upload-header-errors-suggestions {
  color: $color-danger;

  p:last-child { margin-bottom: 0; }

  code { border: 1px solid $color-danger; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This refers to the header row of a spreadsheet.
    "expectedHeader": "Expected header",
    "suggestions": {
      // Suggestions to fix an error
      "title": "Suggestions",
      "invalidQuotes": "A quoted field is invalid. Check the header row of your file to see if there are any unusual values.",
      // {label} will have the text "label" and refers to the "label" property.
      // The name of the property is not translated.
      "missingLabel": "A {label} property is required. The label indicates the name to use for each Entity throughout Central and elsewhere.",
      "unknownProperty": "If you want to add properties to this Entity List, you can do so in the Entity Properties section on the Overview page of this Entity List, or you can upload and publish a Form that references the property.",
      "duplicateColumn": "It looks like two or more columns have the same header. Please make sure column headers are unique.",
      "emptyColumn": "It looks like you have an empty cell in the header. Please remove any empty columns in your file.",
      "delimiterNotComma": "This might be because we got the cell delimiter wrong. We used {delimiter}."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "expectedHeader": "Erwartete Kopfzeile",
    "suggestions": {
      "title": "Vorschläge",
      "invalidQuotes": "Ein zitiertes Feld ist ungültig. Überprüfen Sie die Kopfzeile Ihrer Datei, um zu sehen, ob es irgendwelche ungewöhnlichen Werte gibt.",
      "missingLabel": "Eine {label} Eigenschaft ist erforderlich. Die Bezeichnung gibt den Namen an, der für jedes Objekt in Central und anderswo zu verwenden ist.",
      "unknownProperty": "Wenn Sie Eigenschaften zu dieser Objektliste hinzufügen möchten, können Sie dies im Abschnitt Objekteigenschaften auf der Übersichtsseite dieser Objektliste tun, oder Sie können ein Formular hochladen und veröffentlichen, das auf die Eigenschaft verweist.",
      "duplicateColumn": "Es sieht so aus, als hätten zwei oder mehr Spalten die gleiche Überschrift. Bitte stellen Sie sicher, dass die Spaltenüberschriften eindeutig sind.",
      "emptyColumn": "Es sieht so aus, als ob Sie eine leere Zelle in der Kopfzeile haben. Bitte entfernen Sie alle leeren Spalten in Ihrer Datei.",
      "delimiterNotComma": "Das könnte daran liegen, dass wir das Zellentrennzeichen falsch gesetzt haben. Wir haben {delimiter} benutzt."
    }
  },
  "es": {
    "expectedHeader": "Cabecera prevista",
    "suggestions": {
      "title": "Sugerencias",
      "invalidQuotes": "Un campo citado no es válido. Compruebe la fila de cabecera de su archivo para ver si hay algún valor inusual.",
      "missingLabel": "Se requiere una propiedad {label}. La etiqueta indica el nombre a utilizar para cada Entidad en toda la Central y en otros lugares.",
      "unknownProperty": "Si desea añadir propiedades a esta Lista de entidades, puede hacerlo en la sección Propiedades de la entidad de la página Descripción general de esta Lista de entidades, o puede cargar y publicar un Formulario que haga referencia a la propiedad.",
      "duplicateColumn": "Parece que dos o más columnas tienen el mismo encabezado. Asegúrate de que los encabezados de las columnas son únicos.",
      "emptyColumn": "Parece que tiene una celda vacía en la cabecera. Elimine las columnas vacías de su archivo.",
      "delimiterNotComma": "Esto puede deberse a que nos equivocamos al delimitar las celdas. Hemos utilizado {delimiter}."
    }
  },
  "fr": {
    "expectedHeader": "Entête attendu",
    "suggestions": {
      "title": "Suggestions",
      "invalidQuotes": "Un champ entre guillemets est invalide. Vérifiez que l'entête de votre fichier ne contient pas une valeur inhabituelle.",
      "missingLabel": "Une propriété {label} est requise. Le label indique le nom à utiliser pour chaque entité dans Central et ailleurs.",
      "unknownProperty": "Si vous souhaitez ajouter des propriétés à cette liste d'entités, vous pouvez le faire dans la section Propriétés d'Entités de la page d'aperçu de cette liste d'entités, ou vous pouvez charger et publier un formulaire qui référence ces propriétés.",
      "duplicateColumn": "Il semblerait que deux colonnes ou plus aient le même entête. Assurez vous que les entêtes de colonnes sont uniques.",
      "emptyColumn": "Il semblerait que vous ayez une cellule vide dans la ligne d'entête. Merci de supprimer toutes les colonnes vides de votre fichier.",
      "delimiterNotComma": "Ça pourrait être parce que nous avons mal déterminé le délimiteur. Nous avons utilisé {delimiter}."
    }
  },
  "it": {
    "expectedHeader": "Intestazione prevista",
    "suggestions": {
      "title": "Suggerimenti",
      "invalidQuotes": "Un campo tra virgolette non è valido. Controlla la riga di intestazione del tuo file per vedere se sono presenti valori insoliti.",
      "missingLabel": "Una {label} proprietà è richiesta. L'etichetta indica il nome da utilizzare per ciascuna Entità in tutto Central e altrove.",
      "unknownProperty": "Se si desidera aggiungere proprietà a questo Elenco di entità, è possibile farlo nella sezione Proprietà dell'entità nella pagina Panoramica di questo Elenco di entità, oppure si può caricare e pubblicare un formulario che faccia riferimento alla proprietà.",
      "duplicateColumn": "Sembra che due o più colonne abbiano la stessa intestazione. Assicurarsi che le intestazioni delle colonne siano uniche.",
      "emptyColumn": "Sembra che ci sia una cella vuota nell'intestazione. Eliminare le colonne vuote nel file.",
      "delimiterNotComma": "Ciò potrebbe essere dovuto al fatto che abbiamo sbagliato il delimitatore di cella. Abbiamo usato {delimiter}."
    }
  },
  "pt": {
    "expectedHeader": "Cabeçalho esperado",
    "suggestions": {
      "title": "Sugestões",
      "invalidQuotes": "Um campo entre aspas é inválido. Verifique a linha de cabeçalho do seu arquivo para ver se há valores incomuns.",
      "missingLabel": "Uma propriedade de {label} é obrigatória. O rótulo indica o nome a ser usado para cada Entidade no Central e em outros lugares.",
      "unknownProperty": "Se quiser adicionar propriedades a esta Lista de Entidades, você pode fazê-lo na seção Propriedades da Entidade na página Visão Geral desta Lista de Entidades, ou pode carregar e publicar um Formulário que faça referência à propriedade.",
      "duplicateColumn": "Parece que duas ou mais colunas têm o mesmo cabeçalho. Certifique-se de que os cabeçalhos das colunas sejam exclusivos.",
      "emptyColumn": "Parece que você tem uma célula vazia no cabeçalho. Remova todas as colunas vazias do seu arquivo.",
      "delimiterNotComma": "Isso pode ter ocorrido porque definimos o delimitador de célula errado. Usamos {delimiter}."
    }
  },
  "zh": {
    "expectedHeader": "规范表头",
    "suggestions": {
      "title": "建议",
      "invalidQuotes": "引用的字段无效。请检查您的文件表头，是否有异常值。",
      "missingLabel": "您必须提供{label}属性。该属性将用于在Central及其他各处标识每个实体的名称。",
      "unknownProperty": "如需为此实体列表添加属性，您可通过实体列表概览页的“实体属性”版块进行操作，或上传并发布引用了该属性的表单。",
      "duplicateColumn": "两个或以上纵列的表头名称可能重复。请确保所有列表标题是唯一的。",
      "emptyColumn": "您的标题中可能有空白单元格。请移除文件中所有的空白列。",
      "delimiterNotComma": "可能使用了错误的表格分隔值。这里使用的是{delimiter}。."
    }
  },
  "zh-Hant": {
    "expectedHeader": "預期標題",
    "suggestions": {
      "title": "建議",
      "invalidQuotes": "帶引號的欄位無效。檢查文件的標題行，看看是否有任何異常值。",
      "missingLabel": "需要 1{label} 屬性。此標籤指示整個 Central 和其他地方每個實體使用的名稱。",
      "unknownProperty": "如果您想要向此實體清單新增屬性，您可以在此實體清單的概述頁面上的實體屬性部分中執行此操作，也可以上傳並發布引用該屬性的表單。",
      "duplicateColumn": "看起來兩個或更多列具有相同的標題。請確保列標題是唯一的。",
      "emptyColumn": "標題中似乎有一個空白單元格。請刪除檔案中的所有空白列。",
      "delimiterNotComma": "這可能是因為我們的單元格分隔符號錯誤。我們使用了 1{delimiter}。"
    }
  }
}
</i18n>
