<script setup lang="ts">

import { computed, ref } from 'vue';
import { captureException } from '@sentry/vue';
import { OdkWebForm, POST_SUBMIT__NEW_INSTANCE } from '@getodk/web-forms';
import { type MonolithicInstancePayload } from '@getodk/xforms-engine';
import { queryString, type Form } from '../utils/api';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { Translation } from 'vue-i18n'
import Location from '../utils/location';
import { getDeviceId } from '../utils/device-id';
import { hideSpinner } from '../utils/spinner';
defineOptions({
  name: 'WebFormRenderer'
});

export interface WebFormsRendererProps {
  form: Form;
  xform: string;
  actionType: string;
  instanceId?: string | null;
  submissionAttachments?: string[] | null;
  st?: string | null
}

const props = defineProps<WebFormsRendererProps>();

interface SubmissionData {
  instanceFile: File;
  attachments: File[];
}

interface PostPrimaryInstanceParams {
  st: string | undefined;
  deviceID?: string | undefined;
}

let clearForm:Function;
let submissionData: SubmissionData;

const submissionResult:any = {};
const isEdit = computed(() => props.actionType === 'edit');
const isPublicLink = computed(() => props.actionType === 'public-link');

const deviceID = getDeviceId();

const visibleModal = ref();

const withToken = (url) => `${url}${queryString({ st: props.st })}`;

const getAttachment = (requestUrl: URL) => {
  const encodedName = encodeURIComponent(requestUrl.pathname.split('/').pop()!);
  const draftPath = props.form.draft ? '/draft' : '';
  const url = withToken(`/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}${draftPath}/attachments/${encodedName}`);
  return fetch(url);
};

const postPrimaryInstance = async (file:File) => {
  let url: string;
  let method: string;
  let params: PostPrimaryInstanceParams = {
    st: props.st ?? undefined
  }
  if (isEdit.value) {
    url = `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}`;
    method = 'PUT';
  } else {
    const draftPath = props.form.draft ? '/draft' : '';
    params.deviceID = deviceID;
    url = `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}${draftPath}/submissions`;
    method = 'POST';
  }
  url += queryString(params);
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
    captureException(error);
    return { success: false, data: error };
  }
};

const isProblem = (data:any) => {
  return data != null &&
    typeof data === 'object' &&
    typeof data.code === 'number' &&
    typeof data.message === 'string';
};

const submissionPath = () => {
  const originalUrl = new URL(window.location.href);
  const newPath = `/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}`;
  return new URL(newPath, originalUrl);
};

const isSessionTimeout = (error) => {
  return error?.response &&
    isProblem(error.response.data) &&
    error.response.data.code === 401.2;
}

const getErrorMessage = (data) => {
  if (!data) {
    return;
  }
  if (!data.code) {
    // undefined error
    return 'util.request.noResponse';
  }
  if (data.code === 413) {
    return 'mixin.request.alert.entityTooLarge';
  }
  if (data.code === 404.1) {
    return 'util.request.problem.404_1';
  }
  return data.message;
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
        Location.assign(submissionPath());
      }, 2000);
    } else {
      visibleModal.value = { type: 'submissionModal', hideable: false };
    }
    return;
  }

  // Error handler - Primary Instance
  if (!submissionResult.primaryInstanceResult.success) {
    const error = submissionResult.primaryInstanceResult.data;
    if (isSessionTimeout(error)) {
      visibleModal.value = { type: 'sessionTimeoutModal', hideable: true };
    } else {
      const errorMessage = getErrorMessage(error);
      visibleModal.value = { type: 'errorModal', errorMessage, hideable: true };
    }
    return;
  }

  // Error handler - Attachments
  if (attachmentResultArr.some(r => !r.success)) {
    const sessionTimeout = attachmentResultArr.some(r => isSessionTimeout(r.data));
    if (sessionTimeout) {
      visibleModal.value = { type: 'sessionTimeoutModal', hideable: false };
    } else {
      visibleModal.value = { type: 'retryModal', hideable: false };
    }
  }
};

const uploadAttachment = async (attachment: File, instanceId: string) => {
  const encodedInstanceId = encodeURIComponent(instanceId);
  const encodedName = encodeURIComponent(attachment.name);

  const url = withToken(`/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${encodedInstanceId}/attachments/${encodedName}`);

  let result;
  try {
    const headers = {
      'Content-Type': attachment.type,
      'X-Requested-With': 'XMLHttpRequest'
    };
    const response = await fetch(url, { body: attachment, headers, method: 'POST' });
    const data = await response.json();
    result = { success: response.ok, data: { response: { data } } };
  } catch (error) {
    captureException(error);
    result = { success: false, data: { response: error } };
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

const webFormLoaded = () => {
  hideSpinner();
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

const fetchSubmissionXml = async () => {
  const url = `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}.xml`;
  const response = await fetch(url);
  return await response.text();
};

const fetchSubmissionAttachment = async (attachmentName: string) => {
  // Draft is always false because we don't support editing of draft submissions
  const encodedName = encodeURIComponent(attachmentName);
  const url = `/v1/projects/${props.form.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}/attachments/${encodedName}`;
  return fetch(url);
};

const editInstanceOptions = computed(() => {
  if (isEdit.value) {
    return {
      resolveInstance: fetchSubmissionXml,
      attachmentFileNames: props.submissionAttachments,
      resolveAttachment: fetchSubmissionAttachment
    };
  }
  return null;
});

const closeWindow = () => {
  window.close();
};
</script>

<style scoped>
.p-dialog-content pre {
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
</style>

<template>

  <OdkWebForm
    :form-xml="props.xform"
    :edit-instance="editInstanceOptions"
    :fetch-form-attachment="getAttachment"
    :device-id="deviceID"
    @loaded="webFormLoaded"
    @submit="handleSubmit"/>

  <Dialog modal :visible="!!visibleModal" :draggable="false" :closable="visibleModal?.hideable" @update:visible="visibleModal = null">
		<template #header>
			<span role="heading">{{ $t(visibleModal.type + '.title') }}</span>
		</template>

    <template #default>
      <Translation v-if="visibleModal.type === 'errorModal'" tag="p" keypath="errorModal.body">
        <template #errorMessage>
          <pre>{{ $t(visibleModal.errorMessage) }}</pre>
        </template>
        <template #supportEmail>
          <a href="mailto:support@getodk.org">support@getodk.org</a>
        </template>
      </Translation>
      <Translation v-else-if="visibleModal.type === 'retryModal'" tag="p" keypath="retryModal.body">
        <template #supportEmail>
          <a href="mailto:support@getodk.org">support@getodk.org</a>
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
        "tryAgain": "Try again"
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
      "util": {
        "request": {
          "noResponse": "Something went wrong: there was no response to your request.",
          "problem": {
            "404_1": "The resource you are looking for cannot be found. The resource may have been deleted."
          }
        }
      },
      "mixin": {
        "request": {
          "alert": {
            "entityTooLarge":  "The data that you are trying to upload is too large."
          }
        }
      }
    }
  }
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "es": {
    "action": {
      "close": "Cerrar",
      "tryAgain": "Inténtalo de nuevo"
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
    },
    "util": {
      "request": {
        "noResponse": "Algo salió mal: no hubo respuesta a su solicitud.",
        "problem": {
          "404_1": "El recurso que busca no se encuentra. Es posible que el recurso se haya eliminado."
        }
      }
    },
    "mixin": {
      "request": {
        "alert": {
          "entityTooLarge": "Los datos que estás intentando cargar son demasiado grandes."
        }
      }
    }
  },
  "fr": {
    "action": {
      "close": "Fermer",
      "tryAgain": "Essayer encore"
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
    },
    "util": {
      "request": {
        "noResponse": "Quelque-chose s'est mal passé : il n'y a pas eu de réponse à votre requête.",
        "problem": {
          "404_1": "La ressource que vous cherchez ne peut être trouvée. Peut-être a-t-elle été supprimée."
        }
      }
    },
    "mixin": {
      "request": {
        "alert": {
          "entityTooLarge": "Les données que vous essayez d'envoyer sont trop volumineuses."
        }
      }
    }
  }
}
</i18n>
