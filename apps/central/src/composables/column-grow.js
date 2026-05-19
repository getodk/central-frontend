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

/*
useColumnGrow() is used to dynamically size a column of a table whose
table-layout CSS property is `fixed`. Only one column of a table can be
dynamically sized, and the table must have at least one column whose width is
not set in the CSS, not including the dynamic column. (For the one column to
grow, one or more other columns will have to shrink.)

Pass a ref to the <th> element of the column to dynamically size, as well as a
factor up to which the column is allowed to grow. The composable will size the
column after it is mounted, according to its content width. The composable also
returns a resize() function that the component can use to resize the column at
any time, for example, after the table becomes visible.
*/

import { px } from '../util/dom';
import { watchSync } from '../util/reactivity';

export default (th, grow) => {
  /* eslint-disable no-param-reassign */
  const resize = () => {
    // Remove style.width if it was previously set in order to calculate the
    // initial width set from the CSS.
    th.value.style.width = '';
    const minWidth = th.value.getBoundingClientRect().width;
    if (minWidth === 0) return;
    const table = th.value.closest('table');
    // This seems to allow columns to grow to fit their content. Even though
    // table-layout is `fixed`, column widths set in the CSS seem to be ignored.
    table.style.width = 'auto';
    const contentWidth = th.value.getBoundingClientRect().width;
    if (contentWidth > minWidth)
      th.value.style.width = px(Math.min(contentWidth, grow * minWidth));
    table.style.width = '';
  };
  /* eslint-enable no-param-reassign */
  watchSync(th, () => { if (th.value != null) resize(); });
  return { resize };
};
