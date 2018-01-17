/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
This mixin is used to highlight a single row of a table. The including component
must define the following property in data():

  - highlighted. Used to determine which row to highlight.
*/
export default () => ({
  methods: {
    // Returns an HTML class object for a row of the table.
    highlight(record, idProp) {
      return { 'bg-success': record[idProp] === this.highlighted };
    }
  }
});
