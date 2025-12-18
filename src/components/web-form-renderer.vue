<!--
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->

<template>
  <template v-if="dataExists">
    <OdkWebForm
      :form-xml="formVersionXml.data"
      :edit-instance="editInstanceOptions"
      :fetch-form-attachment="getAttachment"
      :track-device="true"
      @submit="handleSubmit"/>
  </template>

  <modal id="web-form-renderer-submission-modal" :state="submissionModal.state" :hideable="submissionModal.hideable" backdrop @hide="hideModal()">
    <template #title>{{ $t(submissionModal.type + '.title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <i18n-t v-if="submissionModal.type === 'errorModal'" tag="p" keypath="errorModal.body">
          <template #errorMessage>
            <br><br>
              <pre>{{ submissionModal.errorMessage }}</pre>
          </template>
          <template #supportEmail>
            <a href="emailto:support@getodk.org">support@getodk.org</a>
          </template>
        </i18n-t>
        <i18n-t v-else-if="submissionModal.type === 'retryModal'" tag="p" keypath="retryModal.body">
          <template #supportEmail>
            <a href="emailto:support@getodk.org">support@getodk.org</a>
          </template>
        </i18n-t>
        <i18n-t v-else-if="submissionModal.type === 'sessionTimeoutModal'" tag="p" keypath="sessionTimeoutModal.body.full">
          <template #here>
              <a href="/login" target="_blank">{{ $t('sessionTimeoutModal.body.here') }}</a>
          </template>
        </i18n-t>
        <p v-else>
          {{ $t(submissionModal.type + '.body') }}
        </p>
      </div>
      <div v-if="submissionModal.type === 'submissionModal'" class="modal-actions">
        <button type="button" class="btn btn-link" @click="closeWindow()">
          {{ $t('action.close') }}
        </button>
        <button type="button" class="btn btn-primary" @click="hideModal()">
          {{ $t('submissionModal.action.fillOutAgain') }}
        </button>
      </div>
      <!-- Any type of error while sending attachments -->
      <div v-else-if="submissionModal.type === 'retryModal'
        || (submissionModal.type === 'sessionTimeoutModal' && !submissionModal.hideable)"
        class="modal-actions">
        <button type="button" class="btn btn-primary" @click="submitData()">
          {{ $t('action.tryAgain') }}
        </button>
      </div>
      <!-- Preview modal or any type of error while submitting primary instance -->
      <div v-else-if="submissionModal.type === 'previewModal'
        || submissionModal.type === 'errorModal'
        || submissionModal.type === 'sessionTimeoutModal' && submissionModal.hideable"
        class="modal-actions">
        <button type="button" class="btn btn-primary" @click="hideModal()">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { computed, createApp, getCurrentInstance, inject, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
/* eslint-disable-next-line import/no-unresolved -- not sure why eslint is complaining about it */
import { OdkWebForm, webFormsPlugin, POST_SUBMIT__NEW_INSTANCE } from '@getodk/web-forms';
import Modal from './modal.vue';

import { apiPaths, isProblem, queryString, requestAlertMessage } from '../util/request';
import { modalData } from '../util/reactivity';
import { noop } from '../util/util';
import { runSequentially } from '../util/promise';
import { useRequestData } from '../request-data';
import useRequest from '../composables/request';
import useRoutes from '../composables/routes';

const { resourceStates, form, createResource } = useRequestData();
const formVersionXml = createResource('formVersionXml');
const { request } = useRequest();
const submissionAttachments = createResource('submissionAttachments');
const submissionModal = modalData();
const route = useRoute();
const router = useRouter();
const { submissionPath } = useRoutes();

defineOptions({
  name: 'WebFormRenderer'
});

const props = defineProps({
  actionType: {
    type: String,
    required: true
  },
  instanceId: String
});

const emit = defineEmits(['loaded']);

// Install WebFormsPlugin in the component instead of installing it at the
// application level so that @getodk/web-forms package is not loaded for every
// page, thus increasing the initial bundle
const app = createApp({});
app.use(webFormsPlugin);
const inst = getCurrentInstance();
// webFormsPlugin just adds globalProperty ($primevue)
Object.assign(inst.appContext.config.globalProperties, app._context.config.globalProperties);

const { i18n } = inject('container');

const { initiallyLoading, dataExists } = props.actionType === 'edit' ? resourceStates([formVersionXml, submissionAttachments]) : resourceStates([formVersionXml]);

watch(() => initiallyLoading.value, (value) => {
  if (!value) emit('loaded');
});

const isPublicLink = computed(() => !!route.query.st);

const withToken = (url) => `${url}${queryString({ st: route.query.st })}`;

const isEdit = computed(() => props.actionType === 'edit');

/**
 * Convert AxiosResponse into subset of web standard  {@link Response} that satisfies Web-Forms'
 * requirements
 */
const transformAttachmentResponse = (axiosResponse) => {
  const { data, status, statusText, headers } = axiosResponse;

  const fetchHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (key === 'content-type') {
      // because web-forms doesn't want space between media type and charset
      // https://github.com/getodk/web-forms/issues/269
      fetchHeaders.append(key, value.replace('; charset', ';charset'));
    } else {
      fetchHeaders.append(key, value);
    }
  }

  let body;
  if (typeof (data) === 'string' || data instanceof Blob) {
    body = data;
  } else if (headers['content-type'].includes('application/json') ||
            headers['content-type'].includes('application/geo+json')) {
    body = JSON.stringify(data);
  } else {
    // eslint-disable-next-line no-console
    console.error('response data is not a known text format');
  }

  return new Response(body, {
    status,
    statusText,
    headers: fetchHeaders,
  });
};

const fetchFormXml = () => {
  const url = withToken(apiPaths.formXml(form.projectId, form.xmlFormId, !!form.draftToken));
  return formVersionXml.request({
    url
  }).catch(noop);
};

const fetchSubmissionXml = () => {
  const requestUrl = apiPaths.submissionXml(form.projectId, form.xmlFormId, props.instanceId);
  return request({
    url: requestUrl,
    alert: false
  })
    .then(({ data }) => data)
    .catch(noop);
};

const fetchSubmissionAttachments = () => {
  const requestUrl = apiPaths.submissionAttachments(form.projectId, form.xmlFormId, props.instanceId);
  return submissionAttachments.request({ url: requestUrl, alert: false }).catch(noop);
};

const fetchSubmissionAttachment = (attachmentName) => {
  // Draft is always false because we don't support editing of draft submissions
  const requestUrl = apiPaths.submissionAttachment(form.projectId, form.xmlFormId, false, props.instanceId, attachmentName);
  return request({
    url: requestUrl,
    alert: false,
    responseType: 'blob', // Handle all file types for attachments.
  })
    .then(transformAttachmentResponse)
    .catch(noop);
};

const editInstanceOptions = computed(() => {
  if (isEdit.value && submissionAttachments.dataExists) {
    return {
      resolveInstance: fetchSubmissionXml,
      attachmentFileNames: submissionAttachments.data
        .filter(a => a.exists)
        .map(a => a.name),
      resolveAttachment: fetchSubmissionAttachment
    };
  }
  return null;
});

const fetchData = () => {
  fetchFormXml();
  if (isEdit.value) fetchSubmissionAttachments();
};

fetchData();

/**
 * Hide the modal
 */
const hideModal = () => {
  submissionModal.hide();
};

/**
 * Displays the modal
 *
 * @param {Object} [options] - Optional parameters to pass to modal.show().
 */
const showModal = (options) => {
  submissionModal.show({ hideable: true, ...options });
};

const closeWindow = () => {
  window.close();
};

/**
 * Web Form expects host application to provide a function that it can use to
 * fetch attachments. Signature of the function is (url) => Response; where
 * Response is subset of web standard  {@link Response}.
 */
const getAttachment = (url) => {
  const requestUrl = withToken(apiPaths.formAttachment(
    form.projectId,
    form.xmlFormId,
    !form.publishedAt,
    url.pathname.split('/').pop()
  ));
  return request({
    url: requestUrl,
    alert: false,
    responseType: 'blob', // Handle all file types for attachments.
  }).then(transformAttachmentResponse);
};

const postPrimaryInstance = async (file) => {
  let url = apiPaths.submissions(form.projectId, form.xmlFormId, !form.publishedAt, '');

  if (isEdit.value) {
    url = apiPaths.submission(form.projectId, form.xmlFormId, props.instanceId);
  }
  url = withToken(url);
  try {
    const requestOptions = {
      method: isEdit.value ? 'PUT' : 'POST',
      url,
      data: file,
      headers: {
        'content-type': 'text/xml'
      },
      alert: false,
    };
    const { data } = await request(requestOptions);
    return { success: true, data };
  } catch (error) {
    return { success: false, data: error };
  }
};

const uploadAttachment = async (attachment, instanceId) => {
  const url = withToken(apiPaths.submissionAttachment(form.projectId, form.xmlFormId, !form.publishedAt, instanceId, attachment.name));
  const result = {};
  try {
    const requestOptions = {
      method: 'POST',
      url,
      data: attachment,
      alert: false,
      headers: {
        'content-type': attachment.type
      }
    };
    const { data } = await request(requestOptions);
    result.success = true;
    result.data = data;
  } catch (error) {
    result.success = false;
    result.data = error;
  }

  return { name: attachment.name, result };
};

const submissionResult = {};
/**
 * Holds the data received from ODK Web Forms and sent to the server when the Send or Retry
 * buttons are pressed. This supports retry functionality, since ODK Web Forms does not provide
 * a way to access submission data at an arbitrary point in time.
 */
let submissionData = {};
let clearForm;

const initializeSubmissionState = (data, clearFormCallback) => {
  submissionData = data;

  submissionResult.primaryInstanceResult = {
    success: false
  };

  submissionResult.attachmentResult = new Map();
  data.attachments.forEach(attachment => {
    submissionResult.attachmentResult.set(attachment.name, {
      success: false
    });
  });

  clearForm = () => {
    clearFormCallback({ next: POST_SUBMIT__NEW_INSTANCE });
  };
};

const handleResult = () => {
  const attachmentResultArr = [...submissionResult.attachmentResult.values()];
  // Success handler
  if (submissionResult.primaryInstanceResult.success && attachmentResultArr.every(r => r.success)) {
    clearForm();
    if (isPublicLink.value) {
      showModal({ type: 'thankYouModal', hideable: false });
    } else if (isEdit.value) {
      showModal({ type: 'editSubmissionModal', hideable: false });
      setTimeout(() => {
        router.push(submissionPath(form.projectId, form.xmlFormId, props.instanceId));
      }, 2000);
    } else {
      showModal({ type: 'submissionModal', hideable: false });
    }
  }

  // Error handler - Primary Instance
  if (!submissionResult.primaryInstanceResult.success) {
    const error = submissionResult.primaryInstanceResult.data;
    if (error.response && isProblem(error.response.data) && error.response.data.code === 401.2) {
      showModal({ type: 'sessionTimeoutModal' });
    } else {
      showModal({ type: 'errorModal', errorMessage: requestAlertMessage(i18n, error) });
    }
  }

  // Error handler - Attachments
  if (attachmentResultArr.some(r => !r.success)) {
    const isSessionTimeout = attachmentResultArr.some(r => {
      const error = r.data;
      return error.response && isProblem(error.response.data) && error.response.data.code === 401.2;
    });
    if (isSessionTimeout) {
      showModal({ type: 'sessionTimeoutModal', hideable: false });
    } else {
      showModal({ type: 'retryModal', hideable: false });
    }
  }
};

const submitData = async () => {
  showModal({ type: 'sendingDataModal', hideable: false });

  if (!submissionResult.primaryInstanceResult.success) {
    submissionResult.primaryInstanceResult = await postPrimaryInstance(submissionData.instanceFile);
  }

  if (submissionResult.primaryInstanceResult.success) {
    const attachmentRequests = submissionData.attachments
      .filter(a => !submissionResult.attachmentResult.get(a.name).success)
      .map(a => () => uploadAttachment(a, submissionResult.primaryInstanceResult.data.instanceId));
    const attachmentResult = await runSequentially(attachmentRequests);
    attachmentResult.forEach(r => {
      submissionResult.attachmentResult.set(r.name, r.result);
    });
  }

  handleResult();
};

/**
 * When WebForms's submit button is clicked, it dispatches an event which is handed to
 * this handler, which can then upload the form and its attachments as present in the
 * event payload.
 */
const handleSubmit = async (payload, callback) => {
  if (props.actionType === 'preview') {
    showModal({ type: 'previewModal' });
    return;
  }
  const { data: [data], status } = payload;
  if (status !== 'ready') {
    // Status is not ready when Form is not valid and in that case submit button will be disabled,
    // hence this branch should never execute.
    return;
  }

  initializeSubmissionState(data, callback);
  await submitData();
};

// hack: enable/disable ODK Web Form css styles
const setWfStylesDisabled = (disabled) => {
  document.querySelectorAll('style').forEach(styleTag => {
    if (styleTag.textContent.includes('form-initialization-status') ||
        // WF's reset.css
        styleTag.textContent.replace(/\s+/g, '').includes('body{all:revert;')) {
      // eslint-disable-next-line no-param-reassign
      styleTag.disabled = disabled;
    }
  });
};
onMounted(() => {
  setWfStylesDisabled(false);
});
onUnmounted(() => {
  setWfStylesDisabled(true);
});
</script>

<style lang="scss">
@import '../assets/scss/_variables.scss';

#web-form-renderer-submission-modal pre {
  white-space: pre-wrap;
}

</style>

<i18n lang="json5">
  {
    "en": {
      "previewModal": {
        "title": "Data is valid",
        "body": "The data you entered is valid, but it was not submitted because this is a Form preview."
      },
      "submissionModal": {
        "title": "Form successfully sent!",
        "body": "You can fill this Form out again or close if you’re done.",
        "action": {
          "fillOutAgain": "Fill out again"
        }
      },
      "thankYouModal": {
        "title": "Thank you for participating!",
        "body": "You can close this window now."
      },
      "editSubmissionModal": {
        "title": "Submission successful",
        "body": "You will now be redirected."
      },
      "errorModal": {
        "title": "Submission error",
        "body": "Your data was not submitted. Error message: {errorMessage} You can close this dialog and try again. If the error keeps happening, please contact the person who asked you to fill this Form or {supportEmail}."
      },
      "sendingDataModal": {
        "title": "Sending Submission",
        "body": "Your data is being submitted. Please don’t close this window until it’s finished."
      },
      "sessionTimeoutModal": {
        "title": "Session expired",
        "body": {
          "full": "Please log in {here} in a different browser tab and try again.",
          "here": "here"
        }
      },
      "retryModal": {
        "title": "Submission error",
        "body": "Your data was not fully submitted. Please press the “Try again” button to retry. If the error keeps happening, please contact the person who asked you to fill this Form or {supportEmail}."
      },
    }
  }
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "previewModal": {
      "title": "Daten sind gültig",
      "body": "Die von Ihnen eingegebenen Daten sind gültig, aber sie wurden nicht übermittelt, da es sich um eine Formularvorschau handelt."
    },
    "submissionModal": {
      "title": "Formular erfolgreich gesendet!",
      "body": "Sie können dieses Formular erneut ausfüllen oder schliessen, wenn Sie fertig sind.",
      "action": {
        "fillOutAgain": "Nochmals ausfüllen"
      }
    },
    "thankYouModal": {
      "title": "Vielen Dank für Ihre Teilnahme!",
      "body": "Sie können dieses Fenster jetzt schliessen."
    },
    "editSubmissionModal": {
      "title": "Übermittlung erfolgreich",
      "body": "Sie werden nun weitergeleitet."
    },
    "errorModal": {
      "title": "Übermittlungsfehler",
      "body": "Ihre Daten wurden nicht übermittelt. Fehlermeldung: {errorMessage} Sie können dieses Dialogfeld schließen und es erneut versuchen. Wenn der Fehler weiterhin auftritt, wenden Sie sich bitte an die Person, die Sie gebeten hat, dieses Formular auszufüllen, oder an {supportEmail}."
    },
    "sendingDataModal": {
      "title": "Übermittlung senden",
      "body": "Ihre Daten werden jetzt übermittelt. Bitte schliessen Sie dieses Fenster nicht, bevor es fertig ist."
    },
    "sessionTimeoutModal": {
      "title": "Sitzung abgelaufen",
      "body": {
        "full": "Bitte {here} in einem anderen Browser-Tab einloggen und erneut versuchen.",
        "here": "hier"
      }
    },
    "retryModal": {
      "title": "Übermittlungsfehler",
      "body": "Ihre Daten wurden nicht vollständig übermittelt. Bitte drücken Sie die Schaltfläche „Erneut versuchen“, um es noch einmal zu versuchen. Wenn der Fehler weiterhin auftritt, wenden Sie sich bitte an die Person, die Sie gebeten hat, dieses Formular auszufüllen, oder an {supportEmail}."
    }
  },
  "es": {
    "previewModal": {
      "title": "Los datos son válidos",
      "body": "Los datos introducidos son válidos, pero no se han enviado porque se trata de una vista previa del formulario."
    },
    "submissionModal": {
      "title": "Formulario enviado correctamente",
      "body": "Puede rellenar este formulario de nuevo o cerrarlo si ha terminado.",
      "action": {
        "fillOutAgain": "Rellenar de nuevo"
      }
    },
    "thankYouModal": {
      "title": "Gracias por participar.",
      "body": "Ya puede cerrar esta ventana."
    },
    "editSubmissionModal": {
      "title": "Envío correcto",
      "body": "Ahora será redirigido."
    },
    "errorModal": {
      "title": "Error de envío",
      "body": "No se han enviado sus datos. Mensaje de error: {errorMessage} Puede cerrar este cuadro de diálogo e intentarlo de nuevo. Si el error persiste, póngase en contacto con la persona que le pidió que rellenara este formulario o con {supportEmail}."
    },
    "sendingDataModal": {
      "title": "Enviando el formulario",
      "body": "Se están enviando sus datos. No cierre esta ventana hasta que haya terminado."
    },
    "sessionTimeoutModal": {
      "title": "Sesión expirada",
      "body": {
        "full": "Por favor, conéctese {here} en otra pestaña del navegador e inténtalo de nuevo.",
        "here": "aquí"
      }
    },
    "retryModal": {
      "title": "Error de envío",
      "body": "Sus datos no se han enviado completamente. Por favor, pulse el botón «Inténtelo de nuevo» para volver a intentarlo. Si el error persiste, póngase en contacto con la persona que le pidió que rellenara este formulario o con {supportEmail}."
    }
  },
  "fr": {
    "previewModal": {
      "title": "Les données sont valides",
      "body": "Les données renseignées sont valides, mais ne peuvent être soumises car il s'agit d'un aperçu du Formulaire."
    },
    "submissionModal": {
      "title": "Formulaire envoyé avec succès !",
      "body": "Vous pouvez remplir ce Formulaire à nouveau ou le fermer si vous avez terminé.",
      "action": {
        "fillOutAgain": "Remplir à nouveau"
      }
    },
    "thankYouModal": {
      "title": "Merci de votre participation !",
      "body": "Vous pouvez maintenant fermer cette fenêtre."
    },
    "editSubmissionModal": {
      "title": "Soumission réussie",
      "body": "Vous allez être redirigé"
    },
    "errorModal": {
      "title": "Erreur de Soumission",
      "body": "Vos données ne sont pas soumises. Message d'erreur : {errorMessage} Vous pouvez fermer cette boite de dialogue et essayer à nouveau. Si l'erreur persiste, merci de contacter la personne qui vous a demandé de remplir ce Formulaire ou {supportEmail}."
    },
    "sendingDataModal": {
      "title": "Envoi de la Soumission",
      "body": "Votre donnée est en cours de soumission. Merci de ne pas fermer cette fenêtre avant que ce soit terminé."
    },
    "sessionTimeoutModal": {
      "title": "Session expirée",
      "body": {
        "full": "Merci de vous connecter {here} dans un autre onglet de navigateur et essayez à nouveau.",
        "here": "ici"
      }
    },
    "retryModal": {
      "title": "Erreur de soumission",
      "body": "Vos données n'ont pas été soumises. Veuillez cliquer le bouton \"Essayer encore\" pour réessayer. Si l'erreur persiste, merci de contacter la personne qui vous a demandé de remplir ce formulaire ou {supportEmail}."
    }
  },
  "it": {
    "previewModal": {
      "title": "I dati sono validi",
      "body": "I dati inseriti sono validi, ma non sono stati inviati perché si tratta di un'anteprima del formulario."
    },
    "submissionModal": {
      "title": "Formulario inviato correttamente!",
      "body": "È possibile compilare nuovamente questo modulo o chiuderlo se si è terminato.",
      "action": {
        "fillOutAgain": "Compilare di nuovo"
      }
    },
    "thankYouModal": {
      "title": "Grazie per aver partecipato!",
      "body": "Ora è possibile chiudere questa finestra."
    },
    "editSubmissionModal": {
      "title": "Invio riuscito",
      "body": "Ora sarete reindirizzati."
    },
    "errorModal": {
      "title": "Errore invio",
      "body": "I dati non sono stati inviati. Messaggio di errore: {errorMessage} È possibile chiudere questa finestra di dialogo e riprovare. Se l'errore continua a verificarsi, contattate la persona che vi ha chiesto di compilare il formulario oppure {supportEmail}."
    },
    "sendingDataModal": {
      "title": "Mandando invio",
      "body": "I dati vengono inviati. Si prega di non chiudere questa finestra fino al termine dell'operazione."
    },
    "sessionTimeoutModal": {
      "title": "Sessione scaduta",
      "body": {
        "full": "Si prega di accedere {here} in un'altra scheda del browser e riprovare.",
        "here": "qui"
      }
    },
    "retryModal": {
      "title": "Errore invio",
      "body": "I dati non sono stati inviati completamente. Premere il pulsante “Riprova” per riprovare. Se l'errore continua a verificarsi, contattate la persona che vi ha chiesto di compilare il formulario oppure {supportEmail}."
    }
  },
  "pt": {
    "previewModal": {
      "title": "Os dados são válidos",
      "body": "Os dados que você digitou são válidos, mas não foram enviados por que essa é apenas uma Visualização do formulário."
    },
    "submissionModal": {
      "title": "Formulário enviado com sucesso!",
      "body": "Você pode preencher novamente esse formulário ou fechar a página se já tiver terminado.",
      "action": {
        "fillOutAgain": "Preencher novamente"
      }
    },
    "thankYouModal": {
      "title": "Obrigado pela sua participação!",
      "body": "Você pode fechar essa janela agora."
    },
    "editSubmissionModal": {
      "title": "Enviado com sucesso",
      "body": "Você será redirecionado agora."
    },
    "errorModal": {
      "title": "Erro no envio"
    },
    "sendingDataModal": {
      "title": "Enviando a Resposta",
      "body": "Seus dados estão sendo enviados, por favor não feche essa janela até que o envio tenha terminado."
    },
    "sessionTimeoutModal": {
      "title": "Sessão expirada",
      "body": {
        "full": "Por favor, faça login {here} em uma aba diferente do navegador e tente novamente.",
        "here": "aqui"
      }
    },
    "retryModal": {
      "title": "Erro no envio"
    }
  },
  "zh": {
    "previewModal": {
      "title": "数据有效",
      "body": "您输入的数据格式正确，但因当前处于表单预览模式，故未执行提交。"
    },
    "submissionModal": {
      "title": "表单提交成功！",
      "body": "您可继续填写此表单，或完成后关闭页面。",
      "action": {
        "fillOutAgain": "再次填写"
      }
    },
    "thankYouModal": {
      "title": "感谢您的参与！",
      "body": "您现在可以关闭此窗口。"
    },
    "editSubmissionModal": {
      "title": "提交成功",
      "body": "页面即将跳转"
    },
    "errorModal": {
      "title": "提交错误",
      "body": "数据提交失败。错误信息：{errorMessage} 请关闭对话框后重试。若问题持续，请联系表单发放方或{supportEmail}。"
    },
    "sendingDataModal": {
      "title": "正在提交",
      "body": "您的数据正在上传。在完成之前，请不要关闭此窗口。"
    },
    "sessionTimeoutModal": {
      "title": "会话过期",
      "body": {
        "full": "请在新浏览器标签页中{here}登录后重试。",
        "here": "这里"
      }
    },
    "retryModal": {
      "title": "提交错误",
      "body": "数据未完全提交。请点击“重试”按钮再次提交。若问题持续，请联系表单发放方或{supportEmail}。"
    }
  },
  "zh-Hant": {
    "previewModal": {
      "title": "資料有效",
      "body": "您輸入的資料是有效的，但因為這是表單預覽，所以沒有提交。"
    },
    "submissionModal": {
      "title": "表單已成功傳送！",
      "body": "填寫完畢後，您可以再次填寫此表單或關閉。",
      "action": {
        "fillOutAgain": "再次填寫"
      }
    },
    "thankYouModal": {
      "title": "感謝您的參與！",
      "body": "您現在可以關閉此視窗。"
    },
    "editSubmissionModal": {
      "title": "提交成功",
      "body": "現在您將會被重定向。"
    },
    "errorModal": {
      "title": "提交錯誤",
      "body": "您的資料未提交。錯誤訊息：{errorMessage} 您可以關閉此對話框再試一次。如果錯誤持續發生，請聯絡要求您填寫本表單的人員或{supportEmail}。"
    },
    "sendingDataModal": {
      "title": "發送提交內容",
      "body": "正在提交您的資料。在完成之前，請不要關閉此視窗。"
    },
    "sessionTimeoutModal": {
      "title": "會期已過期",
      "body": {
        "full": "請在不同的瀏覽器標籤中{here}登入，然後再試一次。",
        "here": "從這裡"
      }
    },
    "retryModal": {
      "title": "提交錯誤",
      "body": "您的資料未完全提交。請按「再試一次」按鈕重試。如果錯誤持續發生，請聯絡要求您填寫此表格的人或{supportEmail}。"
    }
  }
}
</i18n>
