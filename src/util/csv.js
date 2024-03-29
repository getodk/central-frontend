/*
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Papa from 'papaparse';
import { identity, last } from 'ramda';

import { mockSignal, rejectOnAbort } from './abort';

/*
promiseParse() calls Papa.parse(), returning a promise. It sets up basic error
handling: if there is a file read error, or if the AbortSignal is aborted, then
the promise will be rejected. Other errors from Papa Parse will not result in a
rejected promise, as they are sometimes needed alongside the data. Instead, they
are returned in the Papa Parse results object. If streaming is used, then
additional error handling is possible: if an error is thrown in the step() or
chunk() callback, then the promise will be rejected.
*/
const promiseParse = (i18n, file, signal = mockSignal(), papaOptions = {}) => {
  if (papaOptions.complete != null)
    throw new Error('Option complete not allowed: call then() on the promise instead.');
  if (papaOptions.error != null)
    throw new Error('Option error not allowed: call catch() on the promise instead');

  return new Promise((resolve, reject) => {
    const removeAbortListener = rejectOnAbort(signal, reject);
    if (signal.aborted) return;
    let hasError = false;
    const fullOptions = {
      delimiter: ',',
      // Called for a FileReader error.
      error: (error) => {
        if (signal.aborted) return;
        hasError = true;
        // I can't tell whether complete() will be called, so let's clean up
        // here.
        removeAbortListener();
        reject(new Error(i18n.t('util.csv.readError', error)));
      },
      // Results are not passed in if streaming is used.
      complete: (maybeResults) => {
        removeAbortListener();
        if (!(hasError || signal.aborted)) resolve(maybeResults);
      },
      ...papaOptions
    };
    const streamOption = 'step' in papaOptions
      ? 'step'
      : ('chunk' in papaOptions ? 'chunk' : null);
    if (streamOption != null) {
      const callback = papaOptions[streamOption];
      fullOptions[streamOption] = (results, parser) => {
        if (hasError || signal.aborted) {
          // This seems to call complete() immediately.
          parser.abort();
          return;
        }

        try {
          callback(results);
        } catch (error) {
          hasError = true;
          parser.abort();
          reject(error);
        }
      };
    }
    Papa.parse(file, fullOptions);
  });
};

// `signal` is an AbortSignal.
export const parseCSVHeader = async (i18n, file, signal = undefined) => {
  const { data, errors } = await promiseParse(i18n, file, signal, {
    preview: 1
  });
  const columns = data[0];
  if (errors.length === 0) {
    // Trailing empty cells are not uncommon, so we remove them. But if there
    // was an error, we preserve the empty cells so that the user can be shown
    // something closer to the exact header as it is.
    while (columns.length !== 0 && last(columns) === '') columns.pop();
  }
  return { columns, errors };
};

// Each of these warning functions returns an object to check a CSV file for a
// particular warning. After the object is passed each row, it will indicate
// whether the warning applies and return details about it.
const raggedRowsWarning = (columns) => {
  // 0-indexed row numbers of rows where commas are skipped when the last values
  // are empty
  const ragged = [];
  // Is there a row where commas are present when the last values are empty?
  let anyPadded = false;
  const pushRow = (values, i) => {
    if (values.length < columns.length) {
      if (ragged.length <= 100) ragged.push(i);
    } else if (values.length === columns.length && last(values) === '') {
      anyPadded = true;
    }
  };
  return {
    type: 'raggedRows',
    pushRow,
    hasWarning: () => ragged.length !== 0 && anyPadded,
    get details() { return ragged; }
  };
};
const largeCellWarning = () => {
  // The size and 0-indexed row number of the largest cell containing a comma or
  // newline
  const largestCell = { size: 0, row: -1 };
  // The sizes of the two largest rows (descending order)
  const maxRowSizes = [0, 0];
  const pushRow = (values, i) => {
    let rowSize = 0;
    for (const value of values) {
      rowSize += value.length;
      if (value.length > largestCell.size && value.search(/[,\n\r]/) !== -1) {
        largestCell.size = value.length;
        largestCell.row = i;
      }
    }
    if (rowSize > maxRowSizes[1]) {
      if (rowSize > maxRowSizes[0]) {
        // eslint-disable-next-line prefer-destructuring
        maxRowSizes[1] = maxRowSizes[0];
        maxRowSizes[0] = rowSize;
      } else {
        maxRowSizes[1] = rowSize;
      }
    }
  };
  return {
    type: 'largeCell',
    pushRow,
    hasWarning: () => largestCell.size > maxRowSizes[1],
    get details() { return largestCell.row; }
  };
};

// `columns` is the CSV header as an array.
export const parseCSV = async (i18n, file, columns, options = {}) => {
  const {
    // Function to validate and transform the data of a row. If the function
    // throws an error, it will result in a rejected promise.
    transformRow = identity,
    // An AbortSignal
    signal = undefined
  } = options;

  const data = [];
  const warnings = [raggedRowsWarning(columns), largeCellWarning()];

  let rowIndex = 0;
  const processRow = (values) => {
    // Remove trailing empty cells.
    while (values.length > columns.length && last(values) === '') values.pop();
    if (values.length > columns.length) {
      const counts = {
        expected: i18n.n(columns.length, 'default'),
        actual: i18n.n(values.length, 'default')
      };
      throw new Error(i18n.t('util.csv.dataWithoutHeader', counts, columns.length));
    }

    data.push(transformRow(values, columns));
    for (const warning of warnings) warning.pushRow(values, rowIndex, columns);
    rowIndex += 1;
  };

  try {
    await promiseParse(i18n, file, signal, {
      chunk: ({ data: chunkData, errors }) => {
        if (errors.length !== 0) {
          const error = errors[0];
          // I think MissingQuotes and InvalidQuotes are the only errors that
          // are possible here: UndetectableDelimiter, TooFewFields, and
          // TooManyFields should not be possible.
          const i18nError = new Error(error.type === 'Quotes'
            ? i18n.t('util.csv.invalidQuotes')
            : error.message);
          i18nError.row = error.row;
          throw i18nError;
        }

        // Skip the header.
        if (rowIndex === 0) {
          chunkData.shift();
          rowIndex += 1;
        }

        for (const values of chunkData) processRow(values);
      },
      worker: true
    });
  } catch (error) {
    throw new Error(i18n.t('util.csv.rowError', {
      message: error.message,
      row: i18n.n((error.row ?? rowIndex) + 1, 'default')
    }));
  }

  const warningDetails = { count: 0 };
  for (const warning of warnings) {
    if (warning.hasWarning()) {
      warningDetails.count += 1;
      warningDetails[warning.type] = warning.details;
    }
  }

  return { data, warnings: warningDetails };
};

// truncateRow() truncates an array of strings, returning a new array whose
// number of elements and combined size do not exceed the maximum.
const truncateRow = (values, { maxLength = 10000, maxSize = 10000 }) => {
  // The length of the truncated array
  let length = 0;
  const minMaxLength = Math.min(values.length, maxLength);
  let size = 0;
  while (length < minMaxLength && size < maxSize) {
    size += values[length].length;
    length += 1;
  }
  const truncated = values.slice(0, length);
  if (size > maxSize) {
    truncated[length - 1] = truncated[length - 1]
      .slice(0, maxSize - size)
      .concat('…');
  } else if (length < values.length) {
    truncated.push('…');
  }
  return truncated;
};

// formatCSVRow() formats an array of strings as a CSV row. It is intended for
// display purposes only: the data may be truncated.
export const formatCSVRow = (values, options = {}) =>
  Papa.unparse([truncateRow(values, options)]);
