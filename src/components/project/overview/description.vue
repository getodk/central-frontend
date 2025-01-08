<!--
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <markdown-view v-if="!emptyDescription" id="project-overview-description"
    ref="markdownRef" :class="{ clickable: targetHeight, expanded }" :raw-markdown="description" @click="toggle"/>
  <div v-else-if="canUpdate" id="project-overview-description-update">
    <i18n-t tag="div" class="instructions" keypath="instructions.full">
      <template #projectSettings>
        <router-link :to="projectPath('settings')">{{ $t('instructions.projectSettings') }}</router-link>
      </template>
    </i18n-t>
    <div class="note">{{ $t('note') }}</div>
  </div>
</template>


<script setup>
import { computed, onMounted, onUpdated, ref, nextTick } from 'vue';
import MarkdownView from '../../markdown/view.vue';

import useRoutes from '../../../composables/routes';

defineOptions({
  name: 'ProjectOverviewDescription'
});

const props = defineProps({
  description: {
    type: String
  },
  // This canUpdate boolean is set by the parent project/overview.vue
  // component based on user's permissions on the project.
  // If the description is blank, they will see an explanation and
  // edit link if they are a manager and can update the project.
  // If the description is blank and they don't have permission,
  // nothing will be shown in this description component.
  canUpdate: {
    type: Boolean
  }
});

const { projectPath } = useRoutes();

const emptyDescription = computed(() => !props.description);

const markdownRef = ref(null);

const targetHeight = ref(null);
const expanded = ref(false);

const getExtraProperties = (element) => {
  const style = window.getComputedStyle(element);
  const marginTop = parseFloat(style.marginTop);
  const marginBottom = parseFloat(style.marginBottom);
  const paddingTop = parseFloat(style.paddingTop);
  const paddingBottom = parseFloat(style.paddingBottom);
  const elementHeight = element.offsetHeight;
  const contentHeight = elementHeight - paddingTop - paddingBottom;

  let lineHeight = parseFloat(style.lineHeight);
  if (Number.isNaN(lineHeight)) {
    const fontSize = parseFloat(style.fontSize);
    lineHeight = fontSize * 1.2;
  }

  if (element.tagName === 'IMG') {
    lineHeight = 20;
  }
  return {
    marginTop,
    paddingTop,
    elementHeight,
    paddingBottom,
    marginBottom,
    totalHeight: marginTop + elementHeight + marginBottom,
    lineHeight,
    numberOfLines: Math.round(contentHeight / lineHeight)
  };
};

const getTargetHeight = (element, allowedLines) => {
  let linesCount = 0;
  let runningHeight = 0;
  let previousLineHeight = 0;
  let previousMarginBottom = 0;
  let previousPaddingBottom = 0;

  for (const node of element.children) {
    // Previous node reached the allowed lines and we have more node(s)
    if (linesCount === allowedLines) {
      return runningHeight - previousPaddingBottom - previousMarginBottom - (0.5 * previousLineHeight);
    }

    const { numberOfLines, totalHeight, marginTop, marginBottom, lineHeight, paddingTop, paddingBottom } = getExtraProperties(node);

    // Only if we exceed the allowed number of lines
    if (linesCount + numberOfLines > allowedLines) {
      const linesToShowOfThisNode = allowedLines - linesCount - 0.5;
      return runningHeight + marginTop + paddingTop + (linesToShowOfThisNode * lineHeight);
    }

    linesCount += numberOfLines;
    // Adjustment for margin collapse
    runningHeight += totalHeight - Math.min(previousMarginBottom, marginTop);
    previousLineHeight = lineHeight;
    previousMarginBottom = marginBottom;
    previousPaddingBottom = paddingBottom;
  }
  return null;
};

const setMarkdownHeight = async () => {
  // nextTick is good enough for the calculation being done here. I don't see
  // any screen flicker.
  // https://github.com/vuejs/vue/issues/9200
  await nextTick();
  targetHeight.value = getTargetHeight(markdownRef.value.$el, 4);
  if (targetHeight.value) {
    markdownRef.value.$el.style.height = `${targetHeight.value}px`;
  } else {
    markdownRef.value.$el.style.height = 'auto';
  }
};

onMounted(async () => {
  await setMarkdownHeight();
});

const toggle = () => {
  if (targetHeight.value && markdownRef.value.$el.style.height === 'auto') {
    markdownRef.value.$el.style.height = `${targetHeight.value}px`;
  } else {
    markdownRef.value.$el.style.height = 'auto';
  }
};

onUpdated(async () => {
  await setMarkdownHeight();
});
</script>


<style lang="scss">
@import '../../../assets/scss/mixins';
@import '../../../assets/scss/variables';

#project-overview-description, #project-overview-description-update {
  margin-bottom: 20px;
}

#project-overview-description.clickable {
  cursor: pointer;
  border-bottom: 1px solid $color-subpanel-border;
  overflow: hidden;

  &:hover {
    border-bottom: 1px solid $color-subpanel-border-strong;
  }

  &.expanded {
    border-bottom: none;

    &:hover {
      border-bottom: none;
    }
  }

}

#project-overview-description {
  font-size: 16px;
  line-height: 1.2;
  max-width: 700px;

  /*
    The markdown html can include tags like `<h1>`s with their
    own top margins, which were messing up the appearance of this
    description box (space above and gray border to the left).
  */
  & > :first-child {
    margin-top: 0px;
  }
}

#project-overview-description-update {
  @include italic;

  .instructions {
    font-size: 16px;
  }
  .note {
    font-size: 13px;
  }
}

</style>

<i18n lang="json5">
{
  "en": {
    // This is shown in place of an empty project description and serves as a
    // guide for where and how to change the description.
    "instructions": {
      "full": "Add Project notes, links, instructions and other resources to this space in {projectSettings}.",
      "projectSettings": "Project Settings"
    },
    // This note is also shown with an empty project description explaining who
    // sees the message and can take action on it.
    "note": "Only Project Managers can see this suggestion."
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "instructions": {
      "full": "Přidejte poznámky k projektu, odkazy, pokyny a další zdroje do tohoto prostoru v {projectSettings}.",
      "projectSettings": "Nastavení Projektu"
    },
    "note": "Tento návrh mohou zobrazit pouze projektoví manažeři."
  },
  "de": {
    "instructions": {
      "full": "Fügen Sie diesem Bereich Projektnotizen, Links, Anleitungen und andere Ressourcen hinzu {projectSettings}.",
      "projectSettings": "Projekt-Einstellungen"
    },
    "note": "Nur Projektmanager können diesen Vorschlag sehen."
  },
  "es": {
    "instructions": {
      "full": "Agregue notas del proyecto, enlaces, instrucciones y otros recursos a este espacio en {projectSettings}",
      "projectSettings": "Configuración del proyecto"
    },
    "note": "Solo los administradores de proyectos pueden ver esta sugerencia."
  },
  "fr": {
    "instructions": {
      "full": "Ajoutez des notes, des liens, des instructions ou autres ressources relatifs au Projet à cet espace dans {projectSettings}.",
      "projectSettings": "Paramètres du projet"
    },
    "note": "Seuls les Gestionnaires de Projet peuvent voir cette suggestion."
  },
  "id": {
    "note": "Hanya Manajer Proyek yang dapat melihat saran ini."
  },
  "it": {
    "instructions": {
      "full": "Aggiungi note di progetto, collegamenti, istruzioni e altre risorse a questo spazio in {projectSettings}.",
      "projectSettings": "Impostazioni del progetto"
    },
    "note": "Solo i Project Manager possono vedere questo suggerimento."
  },
  "sw": {
    "instructions": {
      "full": "Ongeza madokezo ya Mradi, viungo, maagizo na nyenzo zingine kwenye nafasi hii katika {projectSettings}.",
      "projectSettings": "Mipangilio ya Mradi"
    },
    "note": "Wasimamizi wa Miradi pekee ndio wanaoweza kuona pendekezo hili."
  },
  "zh-Hant": {
    "instructions": {
      "full": "可由 {projectSettings} ，新增專案註釋、連結、指示和其他資源至以下空間。",
      "projectSettings": "專案設定"
    },
    "note": "只有專案管理員才能看到此建議。"
  }
}
</i18n>
