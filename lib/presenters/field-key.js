/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Vue from 'vue';
import qrcode from 'qrcode-generator';
import { deflate } from 'pako/lib/deflate';

const QR_CODE_TYPE_NUMBER = 0;
// This is the level used in Collect.
const QR_CODE_ERROR_CORRECTION_LEVEL = 'L';
const QR_CODE_CELL_SIZE = 3;
const QR_CODE_MARGIN = 0;

export default class FieldKey {
  constructor(fieldKey) {
    this._fieldKey = fieldKey;
  }

  get id() { return this._fieldKey.id; }
  get displayName() { return this._fieldKey.displayName; }
  get token() { return this._fieldKey.token; }
  get lastUsed() { return this._fieldKey.lastUsed; }
  get createdBy() { return this._fieldKey.createdBy; }
  get createdAt() { return this._fieldKey.createdAt; }

  get key() {
    if (this._key != null) return this._key;
    this._key = Vue.prototype.$uniqueId();
    return this._key;
  }

  qrCodeHtml() {
    if (this._qrCodeHtml != null) return this._qrCodeHtml;
    const code = qrcode(QR_CODE_TYPE_NUMBER, QR_CODE_ERROR_CORRECTION_LEVEL);
    const url = `${window.location.origin}/api/v1/key/${this._fieldKey.token}`;
    // Collect requires the JSON to have 'general' and 'admin' keys, even if the
    // associated values are empty objects.
    const settings = { general: { server_url: url }, admin: {} };
    const deflated = deflate(JSON.stringify(settings), { to: 'string' });
    code.addData(btoa(deflated));
    code.make();
    this._qrCodeHtml = code.createImgTag(QR_CODE_CELL_SIZE, QR_CODE_MARGIN);
    return this._qrCodeHtml;
  }
}
