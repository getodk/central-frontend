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
import Base from './base';
import collectQr from '../util/collect-qr';
import { apiPaths } from '../util/request';

const props = [
  'id',
  'projectId',
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

const collectQrOptions = { errorCorrectionLevel: 'L', cellSize: 3 };

export default class FieldKey extends Base(props) {
  qrCodeHtml() {
    if (this._qrCodeHtml != null) return this._qrCodeHtml;
    const url = apiPaths.serverUrlForFieldKey(this.token, this.projectId);
    this._qrCodeHtml = collectQr(url, collectQrOptions);
    return this._qrCodeHtml;
  }
}
