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
      // Called for a FileReader error.
      error: (error) => {
        if (signal.aborted) return;
        hasError = true;
        // I can't tell whether complete() will be called, so let's clean up
        // here.
        removeAbortListener();
        reject(new Error(i18n.t('util.csv.readError', { message: error.message })));
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
  const { data, errors, meta } = await promiseParse(i18n, file, signal, {
    delimitersToGuess: [',', ';', '\t', '|'],
    preview: 1
  });
  const columns = data.length !== 0 ? data[0] : [];
  // Make a simple try at detecting a binary file by searching for a null
  // character. We do that in order to avoid displaying unintelligible binary
  // data to the user. Also, Backend would probably reject a null character
  // that's sent to it.
  if (columns.some(column => column.includes('\0')))
    throw new Error(i18n.t('util.csv.invalidCSV', { name: file.name }));
  const unhandledErrors = errors.filter(error =>
    error.code !== 'UndetectableDelimiter');
  if (unhandledErrors.length === 0) {
    // Trailing empty cells are not uncommon, so we remove them. But if there
    // was an error, we preserve the empty cells so that the user can be shown
    // something closer to the exact header as it is.
    while (columns.length !== 0 && last(columns) === '') columns.pop();
  }
  return {
    columns,
    errors: unhandledErrors,
    meta: { delimiter: meta.delimiter }
  };
};

// Each of these warning functions returns an object to check a CSV file for a
// particular warning. After the object is passed each row, it will indicate
// whether the warning applies and return details about it.
const raggedRowsWarning = (columns) => {
  // `ragged` stores the 0-indexed row numbers of ragged rows: rows where the
  // delimiter is skipped when the last values are empty. Specifically, `ragged`
  // is an array of row number ranges where each row in the range is ragged.
  const ragged = [];
  // Is there a row where the delimiter is present when the last values are
  // empty?
  let anyPadded = false;
  const pushRow = (values, i) => {
    if (values.length < columns.length) {
      const lastRange = last(ragged);
      if (lastRange != null && i === lastRange[1] + 1)
        lastRange[1] = i;
      else if (ragged.length < 500)
        ragged.push([i, i]);
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
const largeCellWarning = (delimiter) => {
  // The size and 0-indexed row number of the largest cell containing a
  // delimiter or newline
  const largestCell = { size: 0, row: -1 };
  // The sizes of the two largest rows (descending order)
  const maxRowSizes = [0, 0];
  const pushRow = (values, i) => {
    let rowSize = 0;
    for (const value of values) {
      rowSize += value.length;
      if (value.length > largestCell.size &&
        (value.includes(delimiter) || value.search(/[\n\r]/) !== -1)) {
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
    hasWarning: () => largestCell.size > 10 * maxRowSizes[1],
    get details() { return largestCell.row; }
  };
};

// `columns` is the CSV header as an array.
export const parseCSV = async (i18n, file, columns, options = {}) => {
  const {
    delimiter = ',',
    // Function to validate and transform the data of a row. If the function
    // throws an error, it will result in a rejected promise.
    transformRow = identity,
    // An AbortSignal
    signal = undefined
  } = options;

  const data = [];
  let emptyRow = -1;
  const warnings = [raggedRowsWarning(columns), largeCellWarning(delimiter)];

  const processRow = (values, index) => {
    // Remove trailing empty cells.
    while (values.length > columns.length && last(values) === '') values.pop();

    // Skip trailing empty rows and do not check them for warnings. Throw for an
    // empty row that is not trailing.
    if (values.every(value => value === '')) {
      if (emptyRow === -1) emptyRow = index;
      return;
    }
    if (emptyRow !== -1) {
      const error = new Error(i18n.t('util.csv.emptyRow'));
      error.row = emptyRow;
      throw error;
    }

    // Throw if there are too many cells.
    if (values.length > columns.length) {
      const counts = {
        expected: i18n.n(columns.length, 'default'),
        actual: i18n.n(values.length, 'default')
      };
      throw new Error(i18n.tc('util.csv.dataWithoutHeader', columns.length, counts));
    }

    if (values.some(value => value.includes('\0'))) {
      const error = new Error(i18n.t('util.csv.invalidCSV', { name: file.name }));
      error.row = NaN;
      throw error;
    }

    data.push(transformRow(values, columns));
    for (const warning of warnings) warning.pushRow(values, index, columns);
  };

  let rowIndex = 0;
  try {
    await promiseParse(i18n, file, signal, {
      delimiter,
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

        for (const values of chunkData) {
          processRow(values, rowIndex);
          rowIndex += 1;
        }
      },
      worker: true
    });
  } catch (error) {
    // Mention the row number in the error message unless the `row` property of
    // the error has been set to NaN.
    if (Number.isNaN(error.row)) throw error;
    throw new Error(i18n.t('util.csv.rowError', {
      message: error.message,
      row: i18n.n((error.row ?? rowIndex) + 1, 'default')
    }));
  }

  const warningResults = {
    count: 0,
    details: {}
  };
  for (const warning of warnings) {
    if (warning.hasWarning()) {
      warningResults.count += 1;
      warningResults.details[warning.type] = warning.details;
    }
  }

  return { data, warnings: warningResults };
};

export const formatCSVDelimiter = (delimiter) =>
  (delimiter === '\t' ? '⇥' : delimiter);

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
export const formatCSVRow = (values, options = {}) => {
  const { maxLength, maxSize, ...papaOptions } = options;
  const truncated = truncateRow(values, { maxLength, maxSize });

  if (papaOptions.delimiter == null) papaOptions.delimiter = ',';
  const formattedDelimiter = formatCSVDelimiter(papaOptions.delimiter);
  if (formattedDelimiter !== papaOptions.delimiter) {
    for (const [i, value] of truncated.entries())
      truncated[i] = value.replaceAll(papaOptions.delimiter, formattedDelimiter);
    papaOptions.delimiter = formattedDelimiter;
  }

  return Papa.unparse([truncated], papaOptions);
};
