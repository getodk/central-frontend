<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <form id="analytics-form" @submit.prevent="submit">
    <div class="radio">
      <label>
        <input v-model="enabled" type="radio" :value="null"
          aria-describedby="analytics-form-enabled-null-help">
        <strong>{{ $t('enabled.null[0]') }}</strong>
      </label>
      <p id="analytics-form-enabled-null-help" class="help-block">
        {{ $t('enabled.null[1]') }}
      </p>
    </div>
    <div class="radio">
      <label>
        <input v-model="enabled" type="radio" :value="false"
          aria-describedby="analytics-form-enabled-false-help">
        <strong>{{ $t('enabled.false[0]') }}</strong>
      </label>
      <p id="analytics-form-enabled-false-help" class="help-block">
        {{ $t('enabled.false[1]') }}
      </p>
    </div>
    <div class="radio">
      <label>
        <input v-model="enabled" type="radio" :value="true">
        <i18n-t keypath="enabled.true[0].full">
          <template #weWillShare>
            <strong>{{ $t('enabled.true[0].weWillShare') }}</strong>
          </template>
          <template #termsOfService>
            <a href="https://getodk.org/tos" target="_blank">{{ $t('enabled.true[0].termsOfService') }}</a>
          </template>
          <template #privacyPolicy>
            <a href="https://getodk.org/privacy" target="_blank">{{ $t('enabled.true[0].privacyPolicy') }}</a>
          </template>
        </i18n-t>
      </label>
      <p id="analytics-form-enabled-true-help" class="help-block">
        <a href="#" @click.prevent="$emit('preview')">
          <span class="icon-question-circle-o"></span>{{ $t('enabled.true[1]') }}
        </a>
      </p>
    </div>
    <fieldset :disabled="enabled !== true">
      <div class="checkbox">
        <label>
          <input v-model="contact" type="checkbox"
            aria-describedby="analytics-form-contact-help">
          <strong>{{ $t('contact[0]') }}</strong>
        </label>
        <p id="analytics-form-contact-help" class="help-block">
          {{ $t('contact[1]') }}
        </p>
      </div>
      <fieldset :disabled="!contact">
        <form-group v-model.trim="email" type="email"
          :placeholder="$t('field.workEmail')" required autocomplete="off"/>
        <form-group v-model.trim="organization"
          :placeholder="$t('field.organization')" autocomplete="organization"/>
      </fieldset>
    </fieldset>
    <button type="submit" class="btn btn-primary" :aria-disabled="awaitingResponse">
      {{ $t('action.saveSettings') }} <spinner :state="awaitingResponse"/>
    </button>
  </form>
</template>

<script>
import FormGroup from '../form-group.vue';
import Spinner from '../spinner.vue';

import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'AnalyticsForm',
  components: { FormGroup, Spinner },
  inject: ['alert'],
  emits: ['preview'],
  setup() {
    const { currentUser, analyticsConfig } = useRequestData();
    const { awaitingResponse } = analyticsConfig.toRefs();
    return { currentUser, analyticsConfig, awaitingResponse };
  },
  data() {
    const configValue = this.analyticsConfig
      .map(({ value }) => value)
      .orElseGet(() => ({ enabled: null }));
    return {
      enabled: configValue.enabled,
      contact: configValue.email != null || configValue.organization != null,
      email: configValue.email != null
        ? configValue.email
        : (configValue.organization == null ? this.currentUser.email : ''),
      organization: configValue.organization != null
        ? configValue.organization
        : ''
    };
  },
  methods: {
    setConfig() {
      const postData = { enabled: this.enabled };
      if (this.enabled && this.contact) {
        if (this.email !== '') postData.email = this.email;
        if (this.organization !== '')
          postData.organization = this.organization;
      }
      return this.analyticsConfig.request({
        method: 'POST',
        url: '/v1/config/analytics',
        data: postData
      });
    },
    unsetConfig() {
      return this.analyticsConfig.request({
        method: 'DELETE',
        url: '/v1/config/analytics',
        patch: () => { this.analyticsConfig.setToNone(); }
      });
    },
    submit() {
      (this.enabled != null ? this.setConfig() : this.unsetConfig())
        .then(() => {
          this.alert.success(this.$t('alert.success'));
        })
        .catch(noop);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#analytics-form {
  margin-bottom: 35px;

  .radio { margin-bottom: 21px; }
  .help-block { color: $color-text; }
  fieldset { padding-left: 20px; }
  > fieldset { margin-top: -6px; }
  fieldset fieldset { margin-bottom: 5px; }
  .form-control { width: 375px; }
}

#analytics-form-enabled-true-help { margin-top: 12px; }
</style>

<i18n lang="json5">
{
  "en": {
    "enabled": {
      "null": [
        "Remind us later.",
        "Administrators will continue to see the message at the top of the screen."
      ],
      "true": [
        {
          "full": "{weWillShare} and we accept the {termsOfService} and {privacyPolicy}.",
          "weWillShare": "We are willing to share anonymous usage data monthly with the Central team,",
          "termsOfService": "Terms of Service",
          "privacyPolicy": "Privacy Policy"
        },
        "What metrics are sent?"
      ],
      "false": [
        "We are not interested in sharing any information.",
        "You won’t see a reminder about this again."
      ]
    },
    "contact": [
      "I am willing to include my contact information with the report.",
      "We may contact you to learn more about your usage of Central."
    ],
    "field": {
      "workEmail": "Work email address",
      "organization": "Organization name"
    },
    "alert": {
      "success": "Settings successfully saved."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "enabled": {
      "null": [
        "Připomeňte nám to později.",
        "Správci budou i nadále zobrazovat zprávu v horní části obrazovky."
      ],
      "true": [
        {
          "full": "{weWillShare} a přijímáme {termsOfService} a {privacyPolicy}.",
          "weWillShare": "Jsme ochotni měsíčně sdílet anonymní údaje o používání s centrálním týmem,",
          "termsOfService": "Podmínky služby",
          "privacyPolicy": "Zásady ochrany osobních údajů"
        },
        "Jaké metriky se odesílají?"
      ],
      "false": [
        "Nemáme zájem sdílet žádné informace.",
        "Tuto připomínku už neuvidíte."
      ]
    },
    "contact": [
      "Jsem ochoten připojit ke zprávě své kontaktní údaje.",
      "Můžeme vás kontaktovat, abychom se dozvěděli více o vašem používání služby Central."
    ],
    "field": {
      "workEmail": "Pracovní e-mailová adresa",
      "organization": "Název organizace"
    }
  },
  "de": {
    "enabled": {
      "null": [
        "Erinnere uns später",
        "Administratoren werden die Nachrichten weiterhin im oberen Bereich des Bildschirms sehen."
      ],
      "true": [
        {
          "full": "{weWillShare} und wir akzeptieren die {termsOfService} und {privacyPolicy}.",
          "weWillShare": "Wir sind einverstanden, anonyme Nutzungsdaten monatlich mit dem Central-Team zu teilen.",
          "termsOfService": "Nutzungsbedingungen",
          "privacyPolicy": "Datenschutzerklärung"
        },
        "Welche Messwerte werden übermittelt?"
      ],
      "false": [
        "Wir sind nicht daran interessiert Informationen zu teilen.",
        "Sie werden keine Erinnerung mehr kriegen."
      ]
    },
    "contact": [
      "Ich bin einverstanden, dass meine Kontaktdaten im Report ersichtlich sind.",
      "Wir werden Sie unter Umständen kontaktieren, um mehr über Ihre Nutzung von Central zu erfahren."
    ],
    "field": {
      "workEmail": "Email Adresse (geschäftlich)",
      "organization": "Name der Organisation"
    },
    "alert": {
      "success": "Einstellungen erfolgreich gespeichert."
    }
  },
  "es": {
    "enabled": {
      "null": [
        "Recuérdanos más tarde.",
        "Los administradores seguirán viendo el mensaje en la parte superior de la pantalla."
      ],
      "true": [
        {
          "full": "{weWillShare} y aceptamos los {termsOfService} y {privacyPolicy}",
          "weWillShare": "Estamos dispuestos a compartir mensualmente datos de uso anónimos con el equipo central,",
          "termsOfService": "Términos del servicio",
          "privacyPolicy": "Política de privacidad"
        },
        "¿Qué métricas se envían?"
      ],
      "false": [
        "No estamos interesados en compartir ninguna información.",
        "No volverá a ver un recordatorio sobre esto."
      ]
    },
    "contact": [
      "Estoy dispuesto a incluir mi información de contacto con el informe.",
      "Es posible que nos comuniquemos con usted para obtener más información sobre su uso de Central."
    ],
    "field": {
      "workEmail": "Dirección de correo electrónico del trabajo",
      "organization": "Nombre de la Organización"
    },
    "alert": {
      "success": "Ajustes guardados correctamente."
    }
  },
  "fr": {
    "enabled": {
      "null": [
        "Nous le rappeler plus tard.",
        "Les administrateurs continueront à voir le message en haut de l'écran."
      ],
      "true": [
        {
          "full": "{weWillShare} et nous acceptons les {termsOfService} et la {privacyPolicy}.",
          "weWillShare": "Nous souhaitons partager mensuellement des données d'usage anonymisées avec l’équipe de Central .",
          "termsOfService": "Conditions de service",
          "privacyPolicy": "Politique de confidentialité"
        },
        "Quelles sont les métriques envoyées ?"
      ],
      "false": [
        "Nous ne sommes pas intéressés par le partage de ces informations.",
        "Vous ne verrez plus de rappel à ce sujet."
      ]
    },
    "contact": [
      "Je souhaite inclure mes informations de contact dans le rapport.",
      "Nous pouvons vous contacter pour en savoir plus sur votre utilisation de Central."
    ],
    "field": {
      "workEmail": "Adresse de courriel professionnelle",
      "organization": "Nom de l'organisation"
    },
    "alert": {
      "success": "Réglages enregistrés."
    }
  },
  "id": {
    "enabled": {
      "null": [
        "Ingatkan kami nanti.",
        "Administrator akan terus melihat pesan di bagian atas layar."
      ],
      "true": [
        {},
        "Metrik apa yang dikirim?"
      ],
      "false": [
        "Kami tidak tertarik untuk berbagi informasi apapun.",
        "Anda tidak akan melihat pengingat tentang ini lagi."
      ]
    },
    "contact": [
      "Saya bersedia menyertakan informasi kontak saya dengan laporan tersebut.",
      "Kami dapat menghubungi anda untuk mempelajari lebih lanjut tentang penggunaan Central oleh anda."
    ],
    "field": {
      "workEmail": "Alamat email kantor",
      "organization": "Nama Organisasi"
    }
  },
  "it": {
    "enabled": {
      "null": [
        "Ricordacelo dopo",
        "Gli amministratori continueranno a vedere il messaggio nella parte superiore dello schermo."
      ],
      "true": [
        {
          "full": "{weWillShare} e accettiamo i {termsOfService} e {privacyPolicy}.",
          "weWillShare": "Siamo disposti a condividere mensilmente dati di utilizzo anonimi con il team Central,",
          "termsOfService": "Termini di servizio",
          "privacyPolicy": "Politica sulla Privacy."
        },
        "Quali metriche vengono inviate?"
      ],
      "false": [
        "Non siamo interessati a condividere alcuna informazione.",
        "Non vedrai più un promemoria al riguardo."
      ]
    },
    "contact": [
      "Sono disposto a includere le mie informazioni di contatto con il rapporto.",
      "Potremmo contattarti per capire meglio sul tuo utilizzo di Central"
    ],
    "field": {
      "workEmail": "Indirizzo email del lavoro",
      "organization": "Nome dell'Organizzazione"
    },
    "alert": {
      "success": "Impostazioni salvate con successo!"
    }
  },
  "ja": {
    "enabled": {
      "null": [
        "後で通知する。",
        "管理者には引き続きスクリーン上部にメッセージが表示されます。"
      ],
      "true": [
        {
          "full": "{weWillShare}また、{termsOfService}と{privacyPolicy}に同意します。",
          "weWillShare": "私たちは毎月、匿名化された利用情報をCentralチームと共有します。",
          "termsOfService": "利用規約",
          "privacyPolicy": "プライバシーポリシー"
        },
        "どのような情報が送信されるのか？"
      ],
      "false": [
        "私たちはデータを共有することに興味はありません。",
        "あなたはこれに関する再通知を受け取ることはありません。"
      ]
    },
    "contact": [
      "私は報告にコンタクトの情報を含みます。",
      "私たちからあなたのODK Centralの利用状況について問い合わせることがあります。"
    ],
    "field": {
      "workEmail": "職場のメールアドレス",
      "organization": "組織名"
    }
  },
  "pt": {
    "enabled": {
      "null": [
        "Lembrar-nos depois.",
        "Os administradores continuarão a ver a mensagem no topo da tela."
      ],
      "true": [
        {
          "full": "{weWillShare} e nós aceitamos os {termsOfService} e a {privacyPolicy}.",
          "weWillShare": "Nós concordamos em compartilhar dados anônimos de uso mensalmente com a equipe do Central,",
          "termsOfService": "Termos de serviço",
          "privacyPolicy": "Política de privacidade"
        },
        "Quais métricas são enviadas?"
      ],
      "false": [
        "Nós não desejamos em compartilhar nenhuma informação.",
        "Você não verá nenhum aviso sobre isso novamente."
      ]
    },
    "contact": [
      "Desejo incluir minhas informações de contato com o relatório.",
      "Nós poderemos entrar em contato com você para saber mais sobre o uso do Central."
    ],
    "field": {
      "workEmail": "Endereço de email de trabalho",
      "organization": "Nome da organização"
    },
    "alert": {
      "success": "Configurações salvas com sucesso."
    }
  },
  "sw": {
    "enabled": {
      "null": [
        "Tukumbushe baadaye",
        "Wasimamizi wataendelea kuona ujumbe juu ya skrini"
      ],
      "true": [
        {
          "full": "{weWillShare} na tunakubali {termsOfService} na {privacyPolicy}.",
          "weWillShare": "Tuko tayari kushiriki data ya matumizi isiyojulikana kila mwezi na timu ya Kati",
          "termsOfService": "Masharti ya Huduma",
          "privacyPolicy": "Sera ya Faragha"
        },
        "Ni vipimo gani vinatumwa?"
      ],
      "false": [
        "Hatutashiriki habari yoyote.",
        "hutaona kikumbusho kuhusu hili tena"
      ]
    },
    "contact": [
      "Niko tayari kujumuisha maelezo yangu ya mawasiliano na ripoti",
      "Tunaweza kuwasiliana nawe ili kupata maelezo zaidi kuhusu matumizi yako ya Central"
    ],
    "field": {
      "workEmail": "Anwani ya barua pepe ya kazini",
      "organization": "Jina la shirika"
    }
  },
  "zh": {
    "enabled": {
      "null": [
        "稍后提醒",
        "管理员仍将在屏幕上方看到此提示信息。"
      ],
      "true": [
        {
          "full": "{weWillShare}，并接受{termsOfService}和{privacyPolicy}。",
          "weWillShare": "我们同意每月向Central团队共享匿名使用数据，",
          "termsOfService": "服务条款",
          "privacyPolicy": "隐私政策"
        },
        "发送了哪些指标？"
      ],
      "false": [
        "我们不希望共享任何信息。",
        "您不会再收到此相关提醒。"
      ]
    },
    "contact": [
      "我同意在报告中包含我的联系方式。",
      "我们可能会联系您以进一步了解Central的使用情况。"
    ],
    "field": {
      "workEmail": "工作邮箱地址",
      "organization": "组织名称"
    },
    "alert": {
      "success": "设置已成功保存。"
    }
  },
  "zh-Hant": {
    "enabled": {
      "null": [
        "稍後提醒我們。",
        "管理員將繼續在畫面上方看到該訊息。"
      ],
      "true": [
        {
          "full": "{weWillShare} 與我們接受 {termsOfService} 與 {privacyPolicy}。",
          "weWillShare": "我們願意每月與 Central 團隊分享匿名使用資料。",
          "termsOfService": "服務條款",
          "privacyPolicy": "隱私權政策"
        },
        "發送哪些指標？"
      ],
      "false": [
        "我們無意分享任何資訊。",
        "您將不會再看到有關此問題的提醒。"
      ]
    },
    "contact": [
      "我願意於報告中包含我的聯絡資訊。",
      "我們可能會與您聯繫，以了解有關 Central 使用情況的更多資訊。"
    ],
    "field": {
      "workEmail": "工作電子郵件地址",
      "organization": "組織名稱"
    },
    "alert": {
      "success": "設定已成功儲存。"
    }
  }
}
</i18n>
