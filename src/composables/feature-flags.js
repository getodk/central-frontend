import { onMounted, onUnmounted, ref } from 'vue';

export default function useFeatureFlags() {
  const features = ref({
    'new-web-forms': false
  });

  const cheatKeys = {
    w: false,
    f: false
  };

  function updateCheatKeys(event, isKeydownEvent) {
    if (event.key.toLowerCase() === 'w') {
      cheatKeys.w = isKeydownEvent;
    }
    if (event.key.toLowerCase() === 'f') {
      cheatKeys.f = isKeydownEvent;
    }

    if (cheatKeys.w && cheatKeys.f) {
      features.value['new-web-forms'] = true;
    } else {
      features.value['new-web-forms'] = false;
    }
  }

  function reset() {
    cheatKeys.w = false;
    cheatKeys.f = false;
    features.value['new-web-forms'] = false;
  }

  const keydownEventHandler = (e) => updateCheatKeys(e, true);
  const keyupEventHandler = (e) => updateCheatKeys(e, false);

  onMounted(() => {
    // eslint-disable-next-line no-console
    console.log(
      '%c ODK Central Alpha Features: \n\n%c- Press and hold the %cW and F %ckeyboard keys on a screen with a form preview button to access the new %cWeb Forms%c preview.\n\n',
      'background-color: #009ecc; font-size: 18px; color: white',
      ';',
      'font-weight: bold; font-size: 14px;',
      '',
      'font-weight: bold; font-size: 14px;',
      '',
    );
    document.addEventListener('keydown', keydownEventHandler);
    document.addEventListener('keyup', keyupEventHandler);
    document.addEventListener('focusout', reset);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', keydownEventHandler);
    document.removeEventListener('keyup', keyupEventHandler);
    document.removeEventListener('focusout', reset);
  });

  return { features };
}
