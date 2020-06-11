import i18n from '../../src/i18n';
import { $tcPath, $tcn } from '../../src/util/i18n';

// eslint-disable-next-line import/prefer-default-export
export const i18nProps = Object.freeze({
  $i18n: i18n,
  $t(...args) { return i18n.t(...args); },
  $tc(...args) { return i18n.tc(...args); },
  $te(...args) { return i18n.te(...args); },
  $n(...args) { return i18n.n(...args); },

  $tcn,
  $tcPath
});
