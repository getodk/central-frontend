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
import qrcode from 'qrcode-generator';
import pako from 'pako/lib/deflate';

import Base from './base';

const props = [
  'id',
  'displayName',
  'token',
  'createdAt',
  'updatedAt',
  // createdBy is a Number unless the data includes extended metadata, in which
  // case createdBy is an Object.
  'createdBy',
  // Extended metadata
  'lastUsed'
];

const QR_CODE_TYPE_NUMBER = 0;
// This is the level used in Collect.
const QR_CODE_ERROR_CORRECTION_LEVEL = 'L';
const QR_CODE_CELL_SIZE = 3;
const QR_CODE_MARGIN = 0;

export default class FieldKey extends Base(props) {
  // projectId is expected to be String.
  constructor(projectId, data) {
    super(data);
    this._projectId = projectId;
  }

  qrCodeHtml() {
    if (this._qrCodeHtml != null) return this._qrCodeHtml;
    const code = qrcode(QR_CODE_TYPE_NUMBER, QR_CODE_ERROR_CORRECTION_LEVEL);
    // Backend generates tokens that are URL-safe.
    const url = `${window.location.origin}/v1/key/${this.token}/projects/${this._projectId}`;
    // Collect requires the JSON to have 'general' and 'admin' keys, even if the
    // associated values are empty objects.
    const settings = { general: { server_url: url }, admin: {} };
    const deflated = pako.deflate(JSON.stringify(settings), { to: 'string' });
    code.addData(btoa(deflated));
    code.make();
    this._qrCodeHtml = code.createImgTag(QR_CODE_CELL_SIZE, QR_CODE_MARGIN);
    return this._qrCodeHtml;
  }
}
