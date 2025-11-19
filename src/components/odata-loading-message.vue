<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div v-show="state" id="odata-loading-message">
    <spinner :state="state" inline/>
    <span id="odata-loading-message-text">{{ message }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Spinner from './spinner.vue';

import { useI18nUtils } from '../util/i18n';

defineOptions({
  name: 'OdataLoadingMessage'
});

const props = defineProps({
  state: Boolean,
  type: {
    type: String,
    required: true
  },
  filter: Boolean,
  totalCount: Number,
  top: Number
});

const { t } = useI18n();
const { tn } = useI18nUtils();

const message = computed(() => {
  if (!props.state) return null;

  if (props.filter)
    return t(`${props.type}.filtered.withoutCount`);

  if (props.totalCount == null || props.totalCount === 0)
    return t(`${props.type}.withoutCount`);

  if (props.top == null || props.totalCount <= props.top)
    return tn(`${props.type}.all`, props.totalCount);

  return tn(`${props.type}.first`, props.totalCount, {
    top: props.top
  });
});
</script>

<style lang="scss">
#odata-loading-message {
  font-size: 12px;
  padding: 20px 0 38px 28px;
}

#odata-loading-message-text {
  color: #555;
  margin-left: 8px;
}
</style>

<i18n lang="json5">
  {
    "en": {
      // @transifexKey component.SubmissionList.loading
      "submission": {
        // This text is shown when the number of Submissions loading is unknown.
        "withoutCount": "Loading Submissions…",
        "all": "Loading {count} Submission… | Loading {count} Submissions…",
        // {top} is a number that is either 250 or 1000. {count} may be any number
        // that is at least 250. The string will be pluralized based on {count}.
        "first": "Loading the first {top} of {count} Submission… | Loading the first {top} of {count} Submissions…",
        // {top} is a number that is either 250 or 1000. {count} may be any number
        // that is at least 250. The string will be pluralized based on {count}.
        "middle": "Loading {top} more of {count} remaining Submission… | Loading {top} more of {count} remaining Submissions…",
        "last": {
          "multiple": "Loading the last {count} Submission… | Loading the last {count} Submissions…",
          "one": "Loading the last Submission…"
        },
        "filtered": {
          // This text is shown when the number of Submissions loading is unknown.
          "withoutCount": "Loading matching Submissions…",
          // {top} is a number that is either 250 or 1000. {count} may be any
          // number that is at least 250. The string will be pluralized based on
          // {count}.
          "middle": "Loading {top} more of {count} remaining matching Submission… | Loading {top} more of {count} remaining matching Submissions…",
          "last": {
            "multiple": "Loading the last {count} matching Submission… | Loading the last {count} matching Submissions…",
            "one": "Loading the last matching Submission…"
          }
        }
      },
      "entity": {
        // This text is shown when the number of Entities loading is unknown.
        "withoutCount": "Loading Entities…",
        "all": "Loading {count} Entity… | Loading {count} Entities…",
        // {top} is a number that is either 250 or 1000. {count} may be any number
        // that is at least 250. The string will be pluralized based on {count}.
        "first": "Loading the first {top} of {count} Entity… | Loading the first {top} of {count} Entities…",
        // {top} is a number that is either 250 or 1000. {count} may be any number
        // that is at least 250. The string will be pluralized based on {count}.
        "middle": "Loading {top} more of {count} remaining Entity… | Loading {top} more of {count} remaining Entities…",
        "last": {
          "multiple": "Loading the last {count} Entity… | Loading the last {count} Entities…",
          "one": "Loading the last Entity…"
        },
        "filtered": {
          // This text is shown when the number of Entities loading is unknown.
          "withoutCount": "Loading matching Entities…",
          // {top} is a number that is either 250 or 1000. {count} may be any
          // number that is at least 250. The string will be pluralized based on
          // {count}.
          "middle": "Loading {top} more of {count} remaining matching Entity… | Loading {top} more of {count} remaining matching Entities…",
          "last": {
            "multiple": "Loading the last {count} matching Entity… | Loading the last {count} matching Entities…",
            "one": "Loading the last matching Entity…"
          }
        }
      }
    }
  }
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "entity": {
      "withoutCount": "Načítání entit...",
      "last": {
        "one": "Načítání poslední entity..."
      },
      "filtered": {
        "withoutCount": "Načítání odpovídajících entit...",
        "last": {
          "one": "Načítání poslední odpovídající entity..."
        }
      }
    },
    "submission": {
      "withoutCount": "Načítání příspěvků…",
      "all": "Načítání {count} příspěvku ... | Načítání {count} příspěvků ... | Načítání {count} příspěvků ... | Načítání {count} příspěvků ...",
      "first": "Načítání prvního {top} z {count} příspěvku… | Načítání prvního {top} ze {count} příspěvků… | Načítání prvního {top} z {count} příspěvků… | Načítání prvního {top} z {count} příspěvků…",
      "middle": "Načítání {top} z dalšího {count} zbývajícího příspěvku… | Načítání {top} z dalších {count} zbývajících příspěvků… | Načítání {top} z dalších {count} zbývajících příspěvků… | Načítání {top} z dalších {count} zbývajících příspěvků…",
      "last": {
        "multiple": "Načítání posledního {count} příspěvku… | Načítání posledních {count} příspěvků… | Načítání posledních {count} příspěvků… | Načítání posledních {count} příspěvků…",
        "one": "Načítání posledního příspěvku…"
      },
      "filtered": {
        "withoutCount": "Načítání odpovídajících příspěvků…",
        "middle": "Načítání {top} z dalších {count} zbývajících odpovídajících příspěvků… | Načítání {top} z dalších {count} zbývajících odpovídajících příspěvků… | Načítání {top} z dalších {count} zbývajících odpovídajících příspěvků… | Načítání {top} z dalších {count} zbývajících odpovídajících příspěvků…",
        "last": {
          "multiple": "Načítání posledního {count} odpovídajícího příspěvku… | Načítání posledních {count} odpovídajících příspěvků… | Načítání posledních {count} odpovídajících příspěvků… | Načítání posledních {count} odpovídajících příspěvků…",
          "one": "Načítání posledního odpovídajícího příspěvku…"
        }
      }
    }
  },
  "de": {
    "entity": {
      "withoutCount": "Lade Objekte ...",
      "all": "Lade {count} Objekt ... | Lade {count} Objekte ...",
      "first": "Laden des ersten {top} von {count} Objekt ... | Laden der ersten {top} von {count} Objekten ...",
      "middle": "Lade {top} weiteres Objekt von {count} übrigen... | Lade weitere {top} von {count} übrigen Objekte...",
      "last": {
        "multiple": "Lade das letzte {count} Objekt... | Lade die letzten {count} Objekte...",
        "one": "Das letzte Objekt wird geladen…"
      },
      "filtered": {
        "withoutCount": "Lade passende Objekte...",
        "middle": "Lade {top} weitere passende Objekte von {count} übrigen... | Lade weitere {top} von {count} übrigen passenden Objekte...",
        "last": {
          "multiple": "Lade das letzte {count} passende Objekt... | Lade die letzten {count} passenden Objekte...",
          "one": "Lade das letzte passende Objekt..."
        }
      }
    },
    "submission": {
      "withoutCount": "Übermittlungen laden...",
      "all": "{count} Übermittlung laden... | {count} Übermittlungen laden...",
      "first": "Lade die ersten {top} von {count} Übermittlung... | Lade die ersten {top} von {count} Übermittlungen...",
      "middle": "Lade weitere {top} von {count} übrigen Übermittlung... | Lade weitere {top} von {count} übrigen Übermittlungen...",
      "last": {
        "multiple": "Die letzte {count} Übermittlung laden... | Die letzten {count} Übermittlungen laden...",
        "one": "Letzte Übermittlung laden..."
      },
      "filtered": {
        "withoutCount": "Lade passende Übermittlungen...",
        "middle": "Lade weitere {top} von {count} übrigen passenden Übermittlung... | Lade weitere {top} von {count} übrigen passenden Übermittlungen...",
        "last": {
          "multiple": "Lade die letzte {count} passenden Übermittlung... | Lade die letzten {count} passenden Übermittlungen...",
          "one": "Lade die letzten passenden Übermittlungen..."
        }
      }
    }
  },
  "es": {
    "entity": {
      "withoutCount": "Cargando las entidades...",
      "all": "Cargando {count} Entidad... | Cargando {count} Entidades... | Cargando {count} Entidades...",
      "first": "Cargando la primera {top} de {count} entidad... | Cargando la primera {top} de {count} entidades... | Cargando la primera {top} de {count} entidades...",
      "middle": "Cargando {top} más de {count} entidad restante... | Cargando {top} más de {count} entidades restantes... | Cargando {top} más de {count} entidades restantes...",
      "last": {
        "multiple": "Cargando la última {count} entidad… | Cargando las últimas {count} entidades… | Cargando las últimas {count} entidades…",
        "one": "Cargando la última entidad..."
      },
      "filtered": {
        "withoutCount": "Cargando entidades coincidentes...",
        "middle": "Cargando {top} más de {count} entidades restantes coincidentes... | Cargando {top} más de {count} entidades restantes coincidentes... | Cargando {top} más de {count} entidades restantes coincidentes...",
        "last": {
          "multiple": "Cargando la última {count} entidad coincidente… | Cargando las últimas {count} entidades coincidentes… | Cargando las últimas {count} entidades coincidentes…",
          "one": "Cargando la última entidad coincidente..."
        }
      }
    },
    "submission": {
      "withoutCount": "Cargando los envíos...",
      "all": "Cargando {count} envío... | Cargando {count} envíos... | Cargando {count} envíos...",
      "first": "Cargando la primera {top} de {count} envios... | Cargando la primera {top} de {count} envios... | Cargando la primera {top} de {count} envios...",
      "middle": "Cargando {top} más de {count} envíos restantes... | Cargando {top} más de {count} envíos restantes... | Cargando {top} más de {count} envíos restantes...",
      "last": {
        "multiple": "Cargando el último {count} envío... | Cargando los últimos {count} envíos... | Cargando los últimos {count} envíos...",
        "one": "Cargando el último envío..."
      },
      "filtered": {
        "withoutCount": "Cargando envíos coincidentes…",
        "middle": "Cargando {top} más de {count} envíos restantes coincidentes... | Cargando {top} más de {count} envíos restantes coincidentes... | Cargando {top} más de {count} envíos restantes coincidentes...",
        "last": {
          "multiple": "Cargando los últimos {count} envíos coincidentes… | Cargando los últimos {count} envíos coincidentes… | Cargando los últimos {count} envíos coincidentes…",
          "one": "Cargando el último envío coincidente…"
        }
      }
    }
  },
  "fr": {
    "entity": {
      "withoutCount": "Chargement des entités...",
      "all": "Chargement de {count} entité... | Chargement de {count} entités... | Chargement de {count} entités...",
      "first": "Chargement de la premières {top} de {count} entité... | Chargement des premières {top} de {count} entités... | Chargement des premières {top} de {count} entités...",
      "middle": "Chargement de {top} autre des {count} entités restantes... | Chargement de {top} autres des {count} entités restantes... | Chargement de {top} autres des {count} entités restantes...",
      "last": {
        "multiple": "Chargement de la dernière {count} entité... | Chargement des dernières {count} entités... | Chargement des dernières {count} entités...",
        "one": "Chargement de la dernière entité..."
      },
      "filtered": {
        "withoutCount": "Chargement des Entités correspondantes...",
        "middle": "Chargement de {top} Entités correspondantes supplémentaires sur {count} restantes | Chargement de {top} Entités correspondantes supplémentaires sur {count} restantes | Chargement de {top} Entités correspondantes supplémentaires sur {count} restantes",
        "last": {
          "multiple": "Chargement de la dernière ({count}) entité correspondante | Chargement des dernières {count} entités correspondantes | Chargement des dernières {count} entités correspondantes...",
          "one": "Chargement de la dernière entité correspondante..."
        }
      }
    },
    "submission": {
      "withoutCount": "Chargement des soumissions...",
      "all": "Chargement de {count} soumission... | Chargement de {count} soumissions... | Chargement de {count} soumissions...",
      "first": "Chargement des premières {top} sur {count} soumissions... | Chargement des premières {top} sur {count} soumissions... | Chargement des premières {top} de {count} soumissions...",
      "middle": "Chargement de {top} autres de {count} soumission restante... | Chargement de {top} autres des {count} soumissions restantes... | Chargement de {top} autres des {count} soumissions restantes...",
      "last": {
        "multiple": "Chargement de la {count} dernière soumissions... | Chargement des {count} dernières soumissions... | Chargement des {count} dernières soumissions...",
        "one": "Chargement la dernière soumission..."
      },
      "filtered": {
        "withoutCount": "Chargement des soumissions correspondantes...",
        "middle": "Chargement de {top} autres des {count} soumissions correspondantes restantes... | Chargement de {top} autres des {count} soumissions correspondantes restantes... | Chargement de {top} autres des {count} soumissions correspondantes restantes...",
        "last": {
          "multiple": "Chargement d'{count} dernière soumission correspondante... | Chargement des {count} dernières soumissions correspondantes... | Chargement des {count} dernières soumissions correspondantes...",
          "one": "Chargement de la dernière soumission correspondante..."
        }
      }
    }
  },
  "id": {
    "submission": {
      "withoutCount": "Memuat kiriman data...",
      "all": "Memuat {count} kiriman data...",
      "first": "Memuat yang pertama {top} dari {count} Pengiriman…",
      "middle": "Memuat {top} dari {count} sisa Pengiriman…",
      "last": {
        "multiple": "Memuat {count} kiriman data terakhir...",
        "one": "Memuat kiriman data terakhir..."
      },
      "filtered": {
        "withoutCount": "Memuat Pengiriman yang cocok...",
        "middle": "Memuat {top} dari {count} sisa Pengiriman yang cocok…",
        "last": {
          "multiple": "Memuat sisa {count} Pengiriman yang cocok…",
          "one": "Memuat Pengiriman terakhir yang cocok"
        }
      }
    }
  },
  "it": {
    "entity": {
      "withoutCount": "Caricando le Entità...",
      "all": "Cricando {count} Entità... | Cricando {count} Entità... | Caricando {count} Entità...",
      "first": "Caricando la prima {top} di {count} Entità… | Caricando la prima {top} di {count} Entità… | Caricando la prima {top} di {count} Entità…",
      "middle": "Caricamento di {top} in più di {count} Entità rimanente... | Caricamento di {top} in più di {count} Entità rimanenti... | Caricamento di {top} in più di {count} Entità rimanenti...",
      "last": {
        "multiple": "Caricando la ultima {count} Entità… | Caricando la ultima {count} Entità… | Caricando la ultima {count} Entità…",
        "one": "Caricamento l'ultima Entità in corso..."
      },
      "filtered": {
        "withoutCount": "Caricando Entità corrispondenti...",
        "middle": "Caricamento di {top} in più di {count} Entità corrispondente rimanente... | Caricamento di {top} in più di {count} Entità corrispondenti rimanenti... | Caricamento di {top} in più di {count} Entità corrispondenti rimanenti...",
        "last": {
          "multiple": "Caricando l'ultima {count} Entità corrispondente… | Caricando le ultime {count} Entità corrispondenti… | Caricando le ultime {count} Entità corrispondenti…",
          "one": "Caricamento l'ultima Entità corrispondente..."
        }
      }
    },
    "submission": {
      "withoutCount": "Caricando invii...",
      "all": "Cricando {count} invio... | Cricando {count} invii... | Caricando {count} invii...",
      "first": "Loading the first {top} of {count} Submission… | Caricando il primo {top} di {count} Invio… | Caricando il primo {top} di {count} Invio…",
      "middle": "Caricamento di {top} in più di {count} invio rimanente... | Caricamento di {top} in più di {count} invii rimanenti... | Caricamento di {top} in più di {count} invii rimanenti...",
      "last": {
        "multiple": "Caricando l'ultimo {count} invio… | Caricando gli ultimi {count} invii… | Caricando gli ultimi {count} invii…",
        "one": "Caricamento dell'ultimo invio in corso..."
      },
      "filtered": {
        "withoutCount": "Caricando invii corrispondenti...",
        "middle": "Caricamento di {top} in più di {count} invio corrispondente rimanente... | Caricamento di {top} in più di {count} invii corrispondenti rimanenti... | Caricamento di {top} in più di {count} invii corrispondenti rimanenti...",
        "last": {
          "multiple": "Caricando l'ultimo {count} invio corrispondente… | Caricando gli ultimi {count} invii corrispondenti… | Caricando gli ultimi {count} invii corrispondenti…",
          "one": "Caricando gli ultimi invii corrispondenti..."
        }
      }
    }
  },
  "ja": {
    "submission": {
      "withoutCount": "提出済フォームの読み込み中...",
      "all": "{count}の提出済フォームを読み込み中...",
      "first": "{count}件の提出済フォームの内、最初の{top}を読み込み中...",
      "middle": "残り{count}件の提出済フォームの内、さらに{top}件を読み込み中...",
      "last": {
        "multiple": "最後の{count}件の提出済フォームを読み込み中...",
        "one": "最後の提出済フォームを読み込み中..."
      },
      "filtered": {
        "withoutCount": "照合できる提出済フォームの読み込み中...",
        "middle": "一致する残り{count}件の提出済フォームの内、さらに{top}件を読み込み中...",
        "last": {
          "multiple": "一致する最後の{count}件の提出済フォームを読み込み中...",
          "one": "最後の照合できる提出済フォームを読み込み中..."
        }
      }
    }
  },
  "pt": {
    "entity": {
      "withoutCount": "Carregando Entidades…",
      "all": "Carregando {count} Entidades… | Carregando {count} Entidades… | Carregando {count} Entidades…",
      "first": "Carregando o primeiro {top} de {count} Entidade… | Carregando o primeiro {top} de {count} Entidades… | Carregando o primeiro {top} de {count} Entidades…",
      "middle": "Carregando {top} mais de {count} Entidade restante… | Carregando {top} mais de {count} Entidades restantes… | Carregando {top} mais de {count} Entidades restantes…",
      "last": {
        "multiple": "Carregando a última {count} Entidade… | Carregando as últimas {count} Entidades… | Carregando as últimas {count} Entidades…",
        "one": "Carregando a última Entidade…"
      },
      "filtered": {
        "withoutCount": "Carregando Entidades correspondentes…",
        "middle": "Carregando {top} mais de {count} Entidade correspondente restante… | Carregando {top} mais de {count} Entidades correspondentes restantes… | Carregando {top} mais de {count} Entidades correspondentes restantes…",
        "last": {
          "multiple": "Carregando a última {count} Entidade correspondente… | Carregando as últimas {count} Entidades correspondentes… | Carregando as últimas {count} Entidades correspondentes…",
          "one": "Carregando a última Entidade correspondente…"
        }
      }
    },
    "submission": {
      "withoutCount": "Carregando respostas...",
      "all": "Carregando {count} resposta... | Carregando {count} respostas... | Carregando {count} respostas...",
      "first": "Carregando as primeira {top} de {count} respostas... | Carregando as primeiras {top} de {count} respostas... | Carregando as primeiras {top} de {count} respostas...",
      "middle": "Carregando mais {top} de {count} resposta que ainda falta... | Carregando mais {top} de {count} respostas que ainda faltam... | Carregando mais {top} de {count} respostas que ainda faltam...",
      "last": {
        "multiple": "Carregando {count} resposta... | Carregando as últimas {count} respostas... | Carregando as últimas {count} respostas...",
        "one": "Carregando a última resposta..."
      },
      "filtered": {
        "withoutCount": "Carregando respostas encontradas...",
        "middle": "Carregando mais {top} de {count} resposta correspondente que ainda falta... | Carregando mais {top} de {count} respostas correspondentes que ainda faltam... | Carregando mais {top} de {count} respostas correspondentes que ainda faltam...",
        "last": {
          "multiple": "Carregando a última {count} resposta correspondente... | Carregando as últimas {count} respostas correspondentes... | Carregando as últimas {count} respostas correspondentes...",
          "one": "Carregando a última resposta encontrada..."
        }
      }
    }
  },
  "sw": {
    "entity": {
      "withoutCount": "Inapakia Huluki...",
      "all": "Inapakia Shirika {count}... | Inapakia Huluki {count}...",
      "first": "Inapakia {top} ya kwanza kati ya {count} Huluki... | Inapakia {top} ya kwanza kati ya Mashirika {count}...",
      "middle": "Inapakia {top} zaidi ya Huluki {count} iliyosalia... | Inapakia {top} zaidi ya Mashirika {count} yaliyosalia...",
      "last": {
        "multiple": "Inapakia Huluki {count} ya mwisho... | Inapakia Huluki {count} za mwisho...",
        "one": "Inapakia Huluki ya mwisho..."
      },
      "filtered": {
        "withoutCount": "Inapakia Huluki zinazolingana...",
        "middle": "Inapakia {top} zaidi ya Huluki {count} iliyosalia inayolingana... | Inapakia {top} zaidi ya Mashirika {count} yaliyosalia yanayolingana...",
        "last": {
          "multiple": "Inapakia Huluki {count} ya mwisho inayolingana... | Inapakia Huluki {count} za mwisho zinazolingana...",
          "one": "Inapakia Huluki ya mwisho inayolingana..."
        }
      }
    },
    "submission": {
      "withoutCount": "Inapakia Mawasilisho...",
      "all": "Inapakia Mawasilisho {count}... | Inapakia Mawasilisho {count}...",
      "first": "Inapakia {top} ya kwanza kati ya Mawasilisho {count}... | Inapakia {top} ya kwanza kati ya Mawasilisho {count}...",
      "middle": "Inapakia {top} zaidi ya Mawasilisho {count} yaliyosalia... | Inapakia {top} zaidi ya Mawasilisho {count} yaliyosalia...",
      "last": {
        "multiple": "Inapakia Mawasilisho {count} ya mwisho... | Inapakia Mawasilisho {count} ya mwisho...",
        "one": "Inapakia Wasilisho la mwisho..."
      },
      "filtered": {
        "withoutCount": "Inapakia Mawasilisho yanayolingana...",
        "middle": "Inapakia {top} zaidi ya Mawasilisho {count} yanayolingana... | Inapakia {top} zaidi ya Mawasilisho {count} yanayolingana...",
        "last": {
          "multiple": "Inapakia Mawasilisho {count} ya mwisho yanayolingana... | Inapakia Mawasilisho {count} ya mwisho yanayolingana...",
          "one": "Inapakia Wasilisho linalolingana la mwisho..."
        }
      }
    }
  },
  "zh": {
    "entity": {
      "withoutCount": "正在加载实体…",
      "all": "正在加载{count}个实体…",
      "first": "正在加载前{top}项（共{count}项）实体…",
      "middle": "正在继续加载剩余{count}项中的{top}项实体…",
      "last": {
        "multiple": "正在加载最后{count}项实体…",
        "one": "正在加载最后1项实体…"
      },
      "filtered": {
        "withoutCount": "正在加载匹配的实体…",
        "middle": "正在继续加载剩余{count}项匹配实体中的{top}项…",
        "last": {
          "multiple": "正在加载最后{count}项匹配实体…",
          "one": "正在加载最后1项匹配实体…"
        }
      }
    },
    "submission": {
      "withoutCount": "正在加载提交内容...",
      "all": "正在加载{count}个提交内容...",
      "first": "正在加载前 {top} 条提交（共 {count} 条）…",
      "middle": "正在继续加载 {top} 条提交（剩余 {count} 条）…",
      "last": {
        "multiple": "正在加载{count}条提交...",
        "one": "正在加载最后一条提交..."
      },
      "filtered": {
        "withoutCount": "正在加载符合的提交...",
        "middle": "正在继续加载 {top} 条匹配的提交（剩余 {count} 条）…",
        "last": {
          "multiple": "正在加载最后 {count} 条匹配的提交…",
          "one": "正在加载最后一条匹配的提交…"
        }
      }
    }
  },
  "zh-Hant": {
    "entity": {
      "withoutCount": "載入實體…",
      "all": "正在載入 {count} 個實體...",
      "first": "正在載入第 {top} 個實體（共 {count} 個）...",
      "middle": "正在載入另外 {top} 個實體（共 {count} 個）...",
      "last": {
        "multiple": "正在載入最後 {count} 個實體...",
        "one": "正在載入最後一個實體..."
      },
      "filtered": {
        "withoutCount": "正在載入符合的實體...",
        "middle": "正在載入另外 {top} 個剩餘的 {count} 個符合實體...",
        "last": {
          "multiple": "正在載入最後 {count} 個符合實體...",
          "one": "正在載入最後一個符合的實體..."
        }
      }
    },
    "submission": {
      "withoutCount": "正在加載提交內容...",
      "all": "正在載入 {count} 個提交內容...",
      "first": "正在載入第 {top} 個提交內容，共 {count} 個提交內容...",
      "middle": "正在載入另外 {top} 個剩餘提交內容（共 {count} 個）...",
      "last": {
        "multiple": "正在載入最後 {count} 筆提交內容...",
        "one": "正在加載最後提交的內容..."
      },
      "filtered": {
        "withoutCount": "正在載入符合的提交內容...",
        "middle": "正在載入另外 {top} 個剩餘的 {count} 個符合提交內容...",
        "last": {
          "multiple": "正在載入最後 {count} 個符合的提交內容...",
          "one": "正在載入最後一個相符的提交..."
        }
      }
    }
  }
}
</i18n>
