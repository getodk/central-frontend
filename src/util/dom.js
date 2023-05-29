/*
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

export const px = (x) => `${x}px`;

class StyleBox {
  constructor(style) {
    this._style = style;
  }
}
for (const [propName, styleName = propName] of [
  ['paddingTop'],
  ['paddingRight'],
  ['paddingBottom'],
  ['paddingLeft'],
  ['borderTop', 'borderTopWidth'],
  ['borderRight', 'borderRightWidth'],
  ['borderBottom', 'borderBottomWidth'],
  ['borderLeft', 'borderLeftWidth'],
  ['marginTop'],
  ['marginRight'],
  ['marginBottom'],
  ['marginLeft']
]) {
  Object.defineProperty(StyleBox.prototype, propName, {
    get() {
      const value = this._style[styleName];
      if (value === '') return 0;
      if (!value.endsWith('px'))
        throw new Error('cannot convert style to number');
      return Number.parseFloat(value);
    }
  });
}

export const styleBox = (style) => new StyleBox(style);

export const requiredLabel = (text, required) => {
  const star = required ? ' *' : '';
  return `${text}${star}`;
};

export const markRowsChanged = (trs) => {
  for (const tr of trs) tr.dataset.markRowsChanged = 'true';
  // Toggling data-mark-rows-changed from 'true' to 'false' will trigger a CSS
  // transition: see app.scss. The CSS specifies the duration of the transition.
  setTimeout(() => {
    for (const tr of trs) tr.dataset.markRowsChanged = 'false';
  });
};
export const markRowChanged = (tr) => { markRowsChanged([tr]); };
