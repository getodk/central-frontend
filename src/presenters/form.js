/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import i18n from '../i18n';
import { presenterClass } from './base';

// This presenter class is used for forms and form versions (primary, draft, and
// archived).

const props = [
  'projectId',
  'xmlFormId',
  'name',
  'version',
  'keyId',
  'sha256',
  // Form and form draft, not form version
  'enketoId',
  // Form only, not form draft or form version
  'enketoSingleId',
  'state',
  'publishedAt',
  'createdAt',
  'updatedAt',
  // Extended form, extended form version, and extended form draft
  'excelContentType',
  // Extended form and extended form draft
  'submissions',
  'lastSubmission',
  'createdBy',
  // Extended form version
  'publishedBy',
  // Form draft
  'draftToken'
];

export default class Form extends presenterClass(props) {
  nameOrId() { return this.name != null ? this.name : this.xmlFormId; }

  versionOrBlank() {
    if (this.version == null) return null;
    return this.version !== ''
      ? this.version
      : i18n.t('presenter.Form.blankVersion');
  }

  updatedOrCreatedAt() {
    return this.updatedAt != null ? this.updatedAt : this.createdAt;
  }
}
