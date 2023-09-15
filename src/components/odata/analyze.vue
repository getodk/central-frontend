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
  <modal v-if="!config.oidcEnabled" id="odata-analyze" :state="state" hideable backdrop
    @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div id="odata-analyze-head">
        <div class="modal-introduction">
          <i18n-t tag="p" keypath="introduction[0]">
            <template #powerBi>
              <a href="https://powerbi.microsoft.com/en-us/" target="_blank" rel="noopener">Power BI</a>
            </template>
            <template #excel>
              <a href="https://www.microsoft.com/en-us/microsoft-365/excel/" target="_blank" rel="noopener">Excel</a>
            </template>
            <template #python>
              <a href="https://www.python.org/" target="_blank" rel="noopener">Python</a>
            </template>
            <template #r>
              <a href="https://www.r-project.org/" target="_blank" rel="noopener">R</a>
            </template>
          </i18n-t>
          <p>{{ $t('introduction[1]') }}</p>
        </div>
        <ul class="nav nav-tabs">
          <li :class="tabClass('microsoft')" role="presentation">
            <a href="#" @click.prevent="setTool('microsoft')">{{ $t('tab.microsoft') }}</a>
          </li>
          <li :class="tabClass('python')" role="presentation">
            <a href="#" @click.prevent="setTool('python')">Python</a>
          </li>
          <li :class="tabClass('r')" role="presentation">
            <a href="#" @click.prevent="setTool('r')">R</a>
          </li>
          <li :class="tabClass('other')" role="presentation">
            <a href="#" @click.prevent="setTool('other')">{{ $t('tab.other') }}</a>
          </li>
        </ul>
      </div>
      <div id="odata-analyze-odata-url" class="modal-introduction">
        <selectable>{{ odataUrl }}</selectable>
      </div>
      <div id="odata-analyze-tool-help" class="modal-introduction">
        <i18n-t v-if="tool === 'microsoft'" tag="p" keypath="help.microsoft.full">
          <template #pageForExcel>
            <a href="https://support.microsoft.com/en-us/office/about-power-query-in-excel-7104fbee-9e62-4cb9-a02e-5bfb1a6c536a" target="_blank" rel="noopener">{{ $t('help.microsoft.pageForExcel') }}</a>
          </template>
          <template #pageForPowerBi>
            <a href="https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connect-odata/" target="_blank" rel="noopener">{{ $t('help.microsoft.pageForPowerBi') }}</a>
          </template>
        </i18n-t>
        <i18n-t v-else-if="tool === 'python'" tag="p" keypath="help.python">
          <template #pyODK>
            <a href="https://docs.getodk.org/pyodk/" target="_blank" rel="noopener">pyODK</a>
          </template>
        </i18n-t>
        <i18n-t v-else-if="tool === 'r'" tag="p" keypath="help.r">
          <template #ruODK>
            <a href="https://docs.ropensci.org/ruODK/" target="_blank" rel="noopener">ruODK</a>
          </template>
        </i18n-t>
        <i18n-t v-else-if="tool === 'other'" tag="p" keypath="help.other.full">
          <template #article>
            <a href="https://odkcentral.docs.apiary.io/#reference/odata-endpoints/" target="_blank" rel="noopener">{{ $t('help.other.article') }}</a>
          </template>
        </i18n-t>
      </div>
      <div id="odata-analyze-actions-container">
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" @click="$emit('hide')">
            {{ $t('action.done') }}
          </button>
        </div>
      </div>
    </template>
  </modal>
</template>

<script>
import Modal from '../modal.vue';
import Selectable from '../selectable.vue';

export default {
  name: 'OdataAnalyze',
  components: { Modal, Selectable },
  inject: ['config'],
  props: {
    state: Boolean,
    odataUrl: String
  },
  emits: ['hide'],
  data() {
    return {
      tool: 'microsoft'
    };
  },
  watch: {
    state(state) {
      if (!state) this.tool = 'microsoft';
    }
  },
  methods: {
    tabClass(tool) {
      return { active: this.tool === tool };
    },
    setTool(tool) {
      this.tool = tool;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#odata-analyze .modal-body {
  padding-left: 0;
  padding-right: 0;

  .modal-introduction {
    margin-bottom: 10px;
  }

  #odata-analyze-head {
    border-bottom: 1px solid $color-subpanel-border-strong;
    padding-left: $padding-modal-body;
    padding-right: $padding-modal-body;

    .nav-tabs {
      margin-top: 15px;
    }
  }

  #odata-analyze-odata-url {
    background-color: $color-subpanel-background;
    margin-bottom: 10px;
    padding: 12px $padding-modal-body;
  }

  #odata-analyze-tool-help {
    margin-top: 15px;
    padding-left: $padding-modal-body;
    padding-right: $padding-modal-body;

    &:empty {
      margin-top: 0px;
    }
  }

  #odata-analyze-actions-container {
    padding-left: $padding-modal-body;
    padding-right: $padding-modal-body;
  }
}
</style>

<i18n lang="json5">
{
  // @transifexKey component.SubmissionAnalyze
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Using OData",
    "introduction": [
      // The text of {powerBi} is "Microsoft Power BI". The text of {r} is "R".
      // The text of {python} is "Python". The text of {excel} is "Excel".
      // {powerBi}, {r}, {excel} and {python} are all links.
      "OData is a standard for transferring data between tools and services. Powerful analysis tools like {powerBi}, {excel}, {python}, and {r} can fetch data via OData for analysis.",
      "To connect to this OData feed, select your tool and copy the link into it."
    ],
    "tab": {
      "microsoft": "Power BI or Excel",
      // This is the text of a navigation tab. "Other" refers to "other tool".
      "other": "Other"
    },
    "help": {
      "microsoft": {
        "full": "For help using OData with Power BI, see {pageForPowerBi}. For help with Excel, see {pageForExcel}.",
        "pageForExcel": "this page",
        "pageForPowerBi": "this page"
      },
      // {pyODK} is a link. Its text is "pyODK".
      "python": "To connect to Central from Python, we recommend {pyODK}. pyODK is the official Python client for Central. It simplifies data analysis and workflow automation.",
      // {ruODK} is a link. Its text is "ruODK".
      "r": "To connect to Central from R, we recommend {ruODK}. ruODK is developed and supported by ODK community members.",
      "other": {
        "full": "For a full description of our OData support, please see {article}.",
        "article": "this article"
      }
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": "Pomocí OData",
    "tab": {
      "microsoft": "Power BI nebo Excel",
      "other": "Jiné"
    },
    "help": {
      "microsoft": {
        "full": "Nápovědu k používání OData s aplikací Power BI naleznete v části {pageForPowerBi}. Nápovědu k aplikaci Excel naleznete v části {pageForExcel}.",
        "pageForExcel": "této straně",
        "pageForPowerBi": "této straně"
      },
      "r": "Pro připojení k Central z R doporučujeme {ruODK}. ruODK je vyvíjen a podporován členy komunity ODK.",
      "other": {
        "full": "Úplný popis podpory OData naleznete v {article}.",
        "article": "tomto článku"
      }
    }
  },
  "de": {
    "title": "OData verwenden",
    "introduction": [
      "OData ist ein Standard, um Daten zwischen Tools und Diensten zu übertragen. Mächtige Tools wie {powerBi}, {excel},{python}, und {r} können Daten für Analysen über OData holen.",
      "Um eine Verbindung zu diesem OData-Feed herzustellen, wählen Sie Ihr Tool und kopieren Sie den Link."
    ],
    "tab": {
      "microsoft": "Power BI oder Excel",
      "other": "Anderes"
    },
    "help": {
      "microsoft": {
        "full": "Für Hilfe zur Verwendung von OData mit Power BI, lesen Sie {pageForPowerBi}. Für Hilfe zu Excel, lesen Sie {pageForExcel}.",
        "pageForExcel": "diese Seite",
        "pageForPowerBi": "diese Seite"
      },
      "python": "Um sich von Python aus mit Central zu verbinden, empfehlen wir {pyODK}. pyODK ist der offizielle Python-Client für Central. Es vereinfacht die Datenanalyse und Workflow-Automatisierung.",
      "r": "Um sich von R aus mit Central zu verbinden, empfehlen wir {ruODK}. ruODK wird von Mitgliedern der ODK-Community entwickelt und unterstützt.",
      "other": {
        "full": "Für eine ausführliche Beschreibung unserer OData-Unterstützung, bitte lesen Sie {article}.",
        "article": "diesen Artikel"
      }
    }
  },
  "es": {
    "title": "Usando protocolo de datos abiertos \"OData\"",
    "introduction": [
      "El protocolo de datos abiertos \"OData\" es un nuevo protocolo que permite realizar transferencia de datos entre aplicaciones y servidores. Herramientas potentes como {powerBi}, {excel}, {python}. y {r} pueden obtener y analizar datos a través de OData.",
      "Para conectarse a esta fuente de OData, seleccione su herramienta y copie el enlace en ella."
    ],
    "tab": {
      "microsoft": "Power BI o Excel",
      "other": "Otro"
    },
    "help": {
      "microsoft": {
        "full": "Para mayor información del uso de OData con Power BI, véase {pageForPowerBi}; con Excel veasé {pageForExcel}.",
        "pageForExcel": "esta página",
        "pageForPowerBi": "esta página"
      },
      "python": "Para conectarse a Central desde Python, recomendamos {pyODK}. pyODK es el cliente oficial de Python para Central. Simplifica el análisis de datos y la automatización del flujo de trabajo.",
      "r": "Para conectarse a Central desde R, recomendamos {ruODK}. ruODK está desarrollado y respaldado por miembros de la comunidad ODK.",
      "other": {
        "full": "Para una descripción detallada del soporte realizado para OData, léa {article}.",
        "article": "este artículo"
      }
    }
  },
  "fr": {
    "title": "Utilisation d'OData",
    "introduction": [
      "OData est un standard pour le transfert de données entre outils et services. De puissants outils d'analyse comme {powerBi}, {excel}, {python} et {r} peuvent récupérer des données par le biais d'OData pour analyse.",
      "Pour commencer à utiliser OData, sélectionnez votre outil et y copiez le lien."
    ],
    "tab": {
      "microsoft": "Power BI ou Excel",
      "other": "Autre"
    },
    "help": {
      "microsoft": {
        "full": "Pour obtenir de l'aide sur l'utilisation d'OData avec Power BI, voir {pageForPowerBi}. Pour de l'aide avec Excel, voir {pageForExcel}.",
        "pageForExcel": "cette page",
        "pageForPowerBi": "cette page"
      },
      "python": "Pour vous connecter à Central via Python, nous recommandons {pyODK}. pyODK est le client Python officiel pour Central. Il simplifie l'analyse de données et l'automatisation des processus.",
      "r": "Pour vous connecter à Central via R, nous recommandons {ruODK}. ruODK est développé et soutenu par des membres de la communauté ODK.",
      "other": {
        "full": "Pour une description complète de notre intégration OData, veuillez consulter {article}.",
        "article": "cet article"
      }
    }
  },
  "id": {
    "title": "Menggunakan OData",
    "tab": {
      "microsoft": "Power BI atau Excel",
      "other": "Lainnya"
    },
    "help": {
      "other": {
        "full": "Untuk deskripsi lengkap tentang dukungan OData kami, silakan lihat {article}.",
        "article": "artikel ini"
      }
    }
  },
  "it": {
    "title": "Utilizzando OData",
    "introduction": [
      "OData è uno standard per il trasferimento di dati tra strumenti e servizi. Strumenti di analisi potenti come {powerBi}, {excel}, {python}, e {r} possono recuperare i dati su OData per l'analisi.",
      "Per connettersi a questo feed OData, seleziona il tuo strumento e copia il link al suo interno."
    ],
    "tab": {
      "microsoft": "Power BI o Excel",
      "other": "Altro"
    },
    "help": {
      "microsoft": {
        "full": "Per informazioni sull'utilizzo di OData con Power BI, vedere {pageForPowerBi}. Per assistenza con Excel, vedere {pageForExcel}.",
        "pageForExcel": "questa pagina",
        "pageForPowerBi": "questa pagina"
      },
      "python": "Per connettersi a Central da Python, consigliamo {pyODK}. pyODK è il client Python ufficiale per Central. Semplifica l'analisi dei dati e l'automazione del flusso di lavoro.",
      "r": "Per connetterti a Central da R, ti consigliamo {ruODK}. ruODK è sviluppato e supportato dai membri della comunità ODK.",
      "other": {
        "full": "Per una descrizione completa del nostro supporto OData, vedere {article}.",
        "article": "questo articolo"
      }
    }
  },
  "ja": {
    "title": "ODataの利用",
    "tab": {
      "other": "その他"
    },
    "help": {
      "other": {
        "full": "ODataに関するサポートの詳細は、{article}を参照して下さい。",
        "article": "こちら"
      }
    }
  },
  "sw": {
    "title": "Kwa kutumia OData",
    "introduction": [
      "OData ni kiwango cha kuhamisha data kati ya zana na huduma. Zana za uchambuzi zenye nguvu kama vile {powerBi}, {excel}, {python} na {r} zinaweza kuleta data kupitia OData kwa uchambuzi.",
      "Ili kuunganisha kwenye mpasho huu wa OData, chagua zana yako na unakili kiungo humo."
    ],
    "tab": {
      "microsoft": "Power BI au Excel",
      "other": "Nyingine"
    },
    "help": {
      "microsoft": {
        "full": "Kwa usaidizi wa kutumia OData na Power BI, angalia {pageForPowerBi}. Kwa usaidizi wa Excel, angalia {pageForExcel}.",
        "pageForExcel": "ukurasa huu",
        "pageForPowerBi": "ukurasa huu"
      },
      "python": "Ili kuunganisha kwa Central kutoka Python, tunapendekeza {pyODK}. pyODK ndiye mteja rasmi wa Python kwa Central. Inarahisisha uchanganuzi wa data na otomatiki wa mtiririko wa kazi.",
      "r": "Ili kuunganisha kwa Central kutoka R, tunapendekeza {ruODK}. ruODK inatengenezwa na kuungwa mkono na wanajamii wa ODK",
      "other": {
        "full": "Kwa maelezo kamili ya usaidizi wetu wa OData, tafadhali angalia {article}.",
        "article": "Makala hii"
      }
    }
  }
}
</i18n>
