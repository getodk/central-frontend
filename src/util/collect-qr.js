/*
Copyright 2020 ODK Central Developers
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

// Generates a QR code for ODK Collect, returning the HTML for an <img> element.
export default (url, { errorCorrectionLevel, cellSize }) => {
  const code = qrcode(0, errorCorrectionLevel);
  // Collect requires the JSON to have `general` and `admin` properties, even if
  // their values are empty objects.
  const settings = {
    general: { server_url: `${window.location.origin}${url}` },
    admin: {}
  };
  const deflated = pako.deflate(JSON.stringify(settings), { to: 'string' });
  code.addData(btoa(deflated));
  code.make();
  return code.createImgTag(cellSize, 0);
};
