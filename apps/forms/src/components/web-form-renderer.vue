<script setup lang="ts">

import { computed, getCurrentInstance, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { OdkWebForm, POST_SUBMIT__NEW_INSTANCE } from '@getodk/web-forms';
import { type MonolithicInstancePayload } from '@getodk/xforms-engine';
import { type Form } from '../utils/api';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { Translation } from 'vue-i18n'

import PrimeVue from 'primevue/config';
import ProgressSpinner from 'primevue/progressspinner';
import { odkThemePreset } from '../../../../packages/web-forms/src/odk-theme-preset';

const router = useRouter();

defineOptions({
  name: 'WebFormRenderer'
});

export interface WebFormsRendererProps {
  form: Form;
  xform: string;
  actionType: string;
  instanceId?: string | null;
}

const props = defineProps<WebFormsRendererProps>();

// Install webFormsPlugin lazily here (not at app startup) to avoid loading @getodk/web-forms on every page.
// This is safe because this component is already loaded asynchronously.
const inst = getCurrentInstance();
if (inst) {
  inst.appContext.app.use(PrimeVue, { theme: { preset: odkThemePreset, options: { darkModeSelector: false } } });
  // TODO this should work instead of the above, but haven't got it working yet...
  // inst.appContext.app.use(webFormsPlugin);
}

interface SubmissionData {
  instanceFile: File;
  attachments: File[];
}

let clearForm:Function;
let submissionData: SubmissionData;

const submissionResult:any = {};
const loading = ref<boolean>(true);
const isEdit = computed(() => props.actionType === 'edit');
const isPublicLink = computed(() => props.actionType === 'public-link');
const attachmentNames = ref<string[]>();

const visibleModal = ref();

const getAttachment = (requestUrl: URL) => {
  const encodedName = encodeURIComponent(requestUrl.pathname.split('/').pop()!);
  const draftPath = '';
  const url = `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}${draftPath}/attachments/${encodedName}`;
  return fetch(url);
};

const postPrimaryInstance = async (file:File) => {
  const draftPath = props.form.draft ? '/draft' : '';
  let url;
  let method;
  if (isEdit.value) {
    url = `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}`;
    method = 'PUT';
  } else {
    url = `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}${draftPath}/submissions`;
    method = 'POST';
  }
  const headers = {
    'Content-Type': 'text/xml',
    'odk-client': `odk-web-forms/${__WEB_FORMS_VERSION__}`,
    'Accept': 'application/json, text/plain, */*',
    'X-Requested-With': 'XMLHttpRequest'
  };
  try {
    const response = await fetch(url, { body: file, headers, method });
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    }
    const data = await response.json();
    return { success: false, data: { response: { data } } };
  } catch (error) {
    return { success: false, data: error };
  }
};

const isProblem = (data:any) => {
  return data != null && typeof data === 'object' &&
    typeof data.code === 'number' && typeof data.message === 'string';
};

const submissionPath = () => {
  return `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}`;
};

const handleResult = () => {

  const attachmentResultArr = [...submissionResult.attachmentResult.values()];

  // Success handler
  if (submissionResult.primaryInstanceResult.success && attachmentResultArr.every(r => r.success)) {

    clearForm();
    
    if (isPublicLink.value) {
      visibleModal.value = { type: 'thankYouModal', hideable: false };
    } else if (isEdit.value) {
      visibleModal.value = { type: 'editSubmissionModal', hideable: false };
      setTimeout(() => {
        router.push(submissionPath());
      }, 2000);
    } else {
      visibleModal.value = { type: 'submissionModal', hideable: false };
    }
  }

  // Error handler - Primary Instance
  if (!submissionResult.primaryInstanceResult.success) {
    const error = submissionResult.primaryInstanceResult.data;
    if (error.response && isProblem(error.response.data) && error.response.data.code === 401.2) {
      visibleModal.value = { type: 'sessionTimeoutModal', hideable: true };
    } else {
      visibleModal.value = { type: 'errorModal', errorMessage: 'errormsg', hideable: true }; // TODO requestAlertMessage(i18n, error) });
    }
  }

  // Error handler - Attachments
  if (attachmentResultArr.some(r => !r.success)) {
    const isSessionTimeout = attachmentResultArr.some(r => {
      const error = r.data;
      return error.response && isProblem(error.response.data) && error.response.data.code === 401.2;
    });
    if (isSessionTimeout) {
      visibleModal.value = { type: 'sessionTimeoutModal', hideable: false };
    } else {
      visibleModal.value = { type: 'retryModal', hideable: false };
    }
  }
};

const uploadAttachment = async (attachment: File, instanceId: string) => {
  const encodedInstanceId = encodeURIComponent(instanceId);
  const encodedName = encodeURIComponent(attachment.name);

  const url = `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${encodedInstanceId}/attachments/${encodedName}`;

  let result;
  try {
    const headers = {
      'Content-Type': attachment.type,
      'X-Requested-With': 'XMLHttpRequest'
    };
    const response = await fetch(url, { body: attachment, headers, method: 'POST' });
    if (response.ok) {
      const data = await response.json();
      result = { success: true, data };
    }
  } catch (error) {
    result = { success: false, data: error };
  }

  return { name: attachment.name, result };
};

const submitData = async () => {
  visibleModal.value = { type: 'sendingDataModal', hideable: false };

  const instanceFile = submissionData.instanceFile;
  const attachments = submissionData.attachments;

  if (!submissionResult.primaryInstanceResult.success) {
    submissionResult.primaryInstanceResult = await postPrimaryInstance(instanceFile);
  }

  if (submissionResult.primaryInstanceResult.success) {
    const instanceId = submissionResult.primaryInstanceResult.data.instanceId;
    const attachmentRequests = attachments
      .filter(a => !submissionResult.attachmentResult.get(a.name).success)
      .map(a => uploadAttachment(a, instanceId));
    const attachmentResult = await Promise.all(attachmentRequests);
    attachmentResult.forEach(r => {
      submissionResult.attachmentResult.set(r.name, r.result);
    });
  }
  handleResult();
};

const initializeSubmissionState = (data:SubmissionData, clearFormCallback:Function) => {
  submissionData = data;

  submissionResult.primaryInstanceResult = {
    success: false
  };

  submissionResult.attachmentResult = new Map();
  data.attachments.forEach((attachment:File) => {
    submissionResult.attachmentResult.set(attachment.name, {
      success: false
    });
  });

  clearForm = () => {
    clearFormCallback({ next: POST_SUBMIT__NEW_INSTANCE });
  };
};

const handleSubmit = async (
  payload: MonolithicInstancePayload,
	clearFormCallback: Function
) => {
  if (props.actionType === 'preview') {
    visibleModal.value = { type: 'previewModal', hideable: true };
    return;
  }
  const { data: [data], status } = payload;
  if (status !== 'ready') {
    // Status is not ready when Form is not valid and in that case submit button will be disabled,
    // hence this branch should never execute.
    return;
  }
  initializeSubmissionState(data as unknown as SubmissionData, clearFormCallback);
  await submitData();
};

const transformAttachmentResponse = async (response: Response) => {
  const { status, statusText, headers } = response;

  const fetchHeaders = new Headers();
  for (const [key, value] of headers.entries()) {
    if (key === 'content-type') {
      // because web-forms doesn't want space between media type and charset
      // https://github.com/getodk/web-forms/issues/269
      fetchHeaders.append(key, value.replace('; charset', ';charset'));
    } else {
      fetchHeaders.append(key, value);
    }
  }

  let body;
  const contentType = headers.get('content-type');
  if (contentType && (contentType.includes('application/json') || contentType.includes('application/geo+json'))) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return new Response(body, {
    status,
    statusText,
    headers: fetchHeaders,
  });
};

const fetchSubmissionXml = async () => {
  const url = `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}.xml`;
  const response = await fetch(url);
  return await response.text();
};

const fetchSubmissionAttachments = async () => {
  const url = `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}/attachments`;
  const response = await fetch(url);
  const attachments = await response.json();
  attachmentNames.value = attachments
    .filter((a:any) => a.exists)
    .map((a:any) => a.name);
};

const fetchSubmissionAttachment = async (attachmentName: string) => {
  // Draft is always false because we don't support editing of draft submissions
  const encodedName = encodeURIComponent(attachmentName);
  const url = `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}/attachments/${encodedName}`;
  const response = await fetch(url);
  return transformAttachmentResponse(response);
};

const editInstanceOptions = computed(() => {
  if (isEdit.value) {
    return {
      resolveInstance: fetchSubmissionXml,
      attachmentFileNames: attachmentNames.value,
      resolveAttachment: fetchSubmissionAttachment
    };
  }
  return null;
});

const closeWindow = () => {
  window.close();
};

onMounted(() => {
  if (isEdit.value) {
    fetchSubmissionAttachments().then(() => {
      loading.value = false;
    })
  } else {
    loading.value = false;
  }
});
</script>

<template>

  <div v-if="loading" class="spinner-container">
    <ProgressSpinner/>
  </div>

  <template v-else="!loading">
    <OdkWebForm
      :form-xml="props.xform"
      :edit-instance="editInstanceOptions"
      :fetch-form-attachment="getAttachment"
      :track-device="true"
      @submit="handleSubmit"/>
  </template>

  <Dialog :visible="!!visibleModal" :draggable="false" :closable="visibleModal?.hideable" @update:visible="visibleModal = null">
		<template #header>
			<span role="heading">{{ $t(visibleModal.type + '.title') }}</span>
		</template>

    <template #default>
      <Translation v-if="visibleModal.type === 'errorModal'" tag="p" keypath="errorModal.body">
        <template #errorMessage>
          <br><br>
          <pre>{{ visibleModal.errorMessage }}</pre>
        </template>
        <template #supportEmail>
          <a href="emailto:support@getodk.org">support@getodk.org</a>
        </template>
      </Translation>
      <Translation v-else-if="visibleModal.type === 'retryModal'" tag="p" keypath="retryModal.body">
        <template #supportEmail>
          <a href="emailto:support@getodk.org">support@getodk.org</a>
        </template>
      </Translation>
      <Translation v-else-if="visibleModal.type === 'sessionTimeoutModal'" tag="p" keypath="sessionTimeoutModal.body.full">
        <template #here>
          <a href="/login" target="_blank">{{ $t('sessionTimeoutModal.body.here') }}</a>
        </template>
      </Translation>
      <span v-else>
        {{ $t(visibleModal.type + '.body') }}
      </span>
    </template>
    <template #footer>
      <template v-if="visibleModal.type === 'submissionModal'">
        <Button type="button" @click="closeWindow()" variant="text">{{ $t('action.close') }}</Button>
        <Button type="button" @click="visibleModal = null">{{ $t('submissionModal.action.fillOutAgain') }}</Button>
      </template>
      <!-- Any type of error while sending attachments -->
      <template v-else-if="visibleModal.type === 'retryModal'
        || (visibleModal.type === 'sessionTimeoutModal' && !visibleModal.hideable)">
        <Button type="button" @click="submitData()">{{ $t('action.tryAgain') }}</Button>
      </template>
      <!-- Preview modal or any type of error while submitting primary instance -->
      <template v-else-if="visibleModal.type === 'previewModal'
        || visibleModal.type === 'errorModal'
        || visibleModal.type === 'sessionTimeoutModal' && visibleModal.hideable">
        <Button type="button" @click="visibleModal = null">{{ $t('action.close') }}</Button>
      </template>
    </template>
  </Dialog>

</template>

<i18n lang="json5">
  {
    "en": {
      "action": {
        "close": "Close",
        "tryAgain": "Try again",
      },
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

<i18n>
{
  "de": {
    "action": {
      "close": "Schließen",
      "tryAgain": "Nochmals versuchen",
    },
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
    "action": {
      "close": "Cerrar",
      "tryAgain": "Inténtalo de nuevo",
    },
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
    "action": {
      "close": "Fermer",
      "tryAgain": "Essayer encore",
    },
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
    "action": {
      "close": "Chiudere",
      "tryAgain": "Ritenta ancora",
    },
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
    "action": {
      "close": "Fechar",
      "tryAgain": "Tentar novamente",
    },
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
      "title": "Erro no envio",
      "body": "Seus dados não foram enviados completamente. Por favor, clique no botão “Tentar novamente” para tentar novamente. Se o erro persistir, entre em contato com a pessoa que solicitou o preenchimento deste formulário ou {supportEmail}."
    }
  },
  "zh": {
    "action": {
      "close": "关闭",
      "tryAgain": "重试",
    },
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
    "action": {
      "close": "關閉",
      "tryAgain": "再試一次",
    },
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
