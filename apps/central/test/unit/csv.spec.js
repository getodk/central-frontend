import sinon from 'sinon';
import { identity } from 'ramda';

import createCentralI18n from '../../src/i18n';
import { formatCSVDelimiter, formatCSVRow, parseCSV, parseCSVHeader } from '../../src/util/csv';
import { noop } from '../../src/util/util';

const i18n = createCentralI18n().global;
const createCSV = (text) => new File([text], 'my_data.csv');

describe('util/csv', () => {
  describe('parseCSVHeader()', () => {
    it('returns the values of the first row', async () => {
      const csv = createCSV('a,"b,c","d\ne"\n1,2,3');
      const { columns } = await parseCSVHeader(i18n, csv);
      columns.should.eql(['a', 'b,c', 'd\ne']);
    });

    it('returns an empty array for an empty file', async () => {
      const { columns } = await parseCSVHeader(i18n, createCSV(''));
      columns.should.eql([]);
    });

    it('does not return trailing empty cells', async () => {
      const { columns } = await parseCSVHeader(i18n, createCSV('a,"",'));
      columns.should.eql(['a']);
    });

    describe('delimiter', () => {
      it('returns the delimiter', async () => {
        const { meta } = await parseCSVHeader(i18n, createCSV('a,b\n1,2'));
        meta.delimiter.should.equal(',');
      });

      it('auto-detects a semicolon delimiter', async () => {
        const { meta } = await parseCSVHeader(i18n, createCSV('a;b\n1;2'));
        meta.delimiter.should.equal(';');
      });

      it('defaults to a comma if the delimiter is undectectable', async () => {
        const { meta } = await parseCSVHeader(i18n, createCSV('a\n1'));
        meta.delimiter.should.equal(',');
      });

      it('does not return an error for an undetectable delimiter', async () => {
        const { errors } = await parseCSVHeader(i18n, createCSV('a\n1'));
        errors.length.should.equal(0);
      });
    });

    it('returns a rejected promise if there is a null character', () => {
      const promise = parseCSVHeader(i18n, createCSV('f\0o,bar'));
      return promise.should.be.rejectedWith('The file “my_data.csv” is not a valid .csv file. It cannot be read.');
    });

    describe('Papa Parse error', () => {
      it('returns an error for a missing quote', async () => {
        const { errors } = await parseCSVHeader(i18n, createCSV('"a\n1'));
        errors.length.should.equal(1);
        errors[0].code.should.equal('MissingQuotes');
      });

      it('returns values along with errors', async () => {
        const { columns } = await parseCSVHeader(i18n, createCSV('"a\n1'));
        columns.should.eql(['a\n1']);
      });

      it('returns trailing empty cells', async () => {
        const csv = createCSV('a,"b"c",');
        const { errors, columns } = await parseCSVHeader(i18n, csv);
        errors.length.should.equal(1);
        columns.should.eql(['a', 'b"c', '']);
      });
    });

    describe('abort signal', () => {
      it('returns a rejected promise if the signal is already aborted', () => {
        const abortController = new AbortController();
        abortController.abort();
        const { signal } = abortController;
        const promise = parseCSVHeader(i18n, createCSV('a'), signal);
        return promise.should.be.rejected;
      });

      it('returns a rejected promise if the signal becomes aborted', () => {
        const abortController = new AbortController();
        const { signal } = abortController;
        const promise = parseCSVHeader(i18n, createCSV('a'), signal);
        abortController.abort();
        return promise.should.be.rejected;
      });
    });
  });

  describe('parseCSV()', () => {
    it('returns the data', async () => {
      const csv = createCSV('a,b\n1,2\n"3,4","5\n6"');
      const { data } = await parseCSV(i18n, csv, ['a', 'b']);
      data.should.eql([['1', '2'], ['3,4', '5\n6']]);
    });

    it('returns to start of file after parseCSVHeader() is called', async () => {
      const csv = createCSV('a,b\n1,2\n3,4');
      const { columns } = await parseCSVHeader(i18n, csv);
      columns.should.eql(['a', 'b']);
      const { data } = await parseCSV(i18n, csv, columns);
      data.should.eql([['1', '2'], ['3', '4']]);
    });

    describe('quote error', () => {
      it('returns a rejected promise', () => {
        const promise = parseCSV(i18n, createCSV('a\n"1"2"'), ['a']);
        return promise.should.be.rejectedWith('There is a problem on row 2 of the file: A quoted field is invalid. Check the row to see if there are any unusual values.');
      });

      it('indicates correct row number if error is not in first row', () => {
        const promise = parseCSV(i18n, createCSV('a\n1\n"2"3"'), ['a']);
        return promise.should.be.rejectedWith(/^There is a problem on row 3 /);
      });

      it('indicates the first row with an error', () => {
        const promise = parseCSV(i18n, createCSV('a\n"1"2"\n"3"4"'), ['a']);
        return promise.should.be.rejectedWith(/^There is a problem on row 2 /);
      });
    });

    it('returns a rejected promise if there is a null character', () => {
      const promise = parseCSV(i18n, createCSV('a\nf\0o'), ['a']);
      return promise.should.be.rejectedWith('The file “my_data.csv” is not a valid .csv file. It cannot be read.');
    });

    describe('number of cells', () => {
      it('allows a row to be ragged', async () => {
        const csv = createCSV('a,b\n1,2\n3');
        const { data } = await parseCSV(i18n, csv, ['a', 'b']);
        data.should.eql([['1', '2'], ['3']]);
      });

      it('returns a rejected promise if there are too many cells', async () => {
        const promise = parseCSV(i18n, createCSV('a\n1,2'), ['a']);
        return promise.should.be.rejectedWith('There is a problem on row 2 of the file: Expected 1 column, but found 2.');
      });

      it('does not reject for an empty cell after last column', async () => {
        const { data } = await parseCSV(i18n, createCSV('a\n1,""'), ['a']);
        data.should.eql([['1']]);
      });

      it('returns an empty cell in the last column', async () => {
        const csv = createCSV('a,b\n1,""');
        const { data } = await parseCSV(i18n, csv, ['a', 'b']);
        data.should.eql([['1', '']]);
      });
    });

    it('uses the specified delimiter', async () => {
      const { data } = await parseCSV(i18n, createCSV('a;b\n1;2'), ['a', 'b'], {
        delimiter: ';'
      });
      data.should.eql([['1', '2']]);
    });

    describe('transformRow option', () => {
      it('transforms the data', async () => {
        const csv = createCSV('a,b\n1,2\n3,4');
        const { data } = await parseCSV(i18n, csv, ['a', 'b'], {
          transformRow: ([a, b]) => ({ a, b })
        });
        data.should.eql([{ a: '1', b: '2' }, { a: '3', b: '4' }]);
      });

      it('returns a rejected promise if function throws an error', () => {
        const promise = parseCSV(i18n, createCSV('a\n1'), ['a'], {
          transformRow: () => { throw new Error('foo'); }
        });
        return promise.should.be.rejectedWith('There is a problem on row 2 of the file: foo');
      });
    });

    describe('abort signal', () => {
      it('returns a rejected promise if the signal is already aborted', () => {
        const abortController = new AbortController();
        abortController.abort();
        const { signal } = abortController;
        const promise = parseCSV(i18n, createCSV('a\n1'), ['a'], { signal });
        return promise.should.be.rejected;
      });

      it('returns a rejected promise if the signal becomes aborted', () => {
        const abortController = new AbortController();
        const { signal } = abortController;
        const promise = parseCSV(i18n, createCSV('a\n1'), ['a'], { signal });
        abortController.abort();
        return promise.should.be.rejected;
      });

      it('does not call transformRow if the signal is aborted', async () => {
        const csv = createCSV('a\n1');
        const transformRow = sinon.fake(identity);
        const abortController = new AbortController();
        const { signal } = abortController;
        const promise = parseCSV(i18n, csv, ['a'], { transformRow, signal });
        abortController.abort();
        await promise.catch(noop);
        transformRow.called.should.be.false;
      });
    });

    describe('warnings', () => {
      it('returns a count of zero if there are no warnings', async () => {
        const { warnings } = await parseCSV(i18n, createCSV('a\n1'), ['a']);
        warnings.should.eql({
          count: 0,
          details: {}
        });
      });

      describe('ragged row', () => {
        it('returns ragged rows if another row is padded', async () => {
          const csv = createCSV('a,b\n1\n2,""\n4');
          const { warnings } = await parseCSV(i18n, csv, ['a', 'b']);
          warnings.should.eql({
            count: 1,
            details: { raggedRows: [[1, 1], [3, 3]] }
          });
        });

        it('returns consecutive rows in a single range', async () => {
          const csv = createCSV('a,b\n1\n2\n3,""\n5\n6');
          const { warnings } = await parseCSV(i18n, csv, ['a', 'b']);
          warnings.should.eql({
            count: 1,
            details: { raggedRows: [[1, 2], [4, 5]] }
          });
        });

        it('returns no more than 500 ranges', async () => {
          const data = 'x,""\ny\n'.repeat(1000);
          const csv = createCSV(`a,b\n${data}`);
          const { warnings } = await parseCSV(i18n, csv, ['a', 'b']);
          const expectedRanges = new Array(500).fill(null).map((_, i) => {
            const row = 2 * (i + 1);
            return [row, row];
          });
          warnings.should.eql({
            count: 1,
            details: { raggedRows: expectedRanges }
          });
        });

        it('does not return ragged rows if no row is padded', async () => {
          const csv = createCSV('a,b\n1\n2,3\n4');
          const { warnings } = await parseCSV(i18n, csv, ['a', 'b']);
          warnings.should.eql({
            count: 0,
            details: {}
          });
        });
      });

      describe('large cell', () => {
        it('returns the row of a relatively large cell that contains a comma', async () => {
          const csv = createCSV('a\n1\n"12345,67890"');
          const { warnings } = await parseCSV(i18n, csv, ['a']);
          warnings.should.eql({
            count: 1,
            details: { largeCell: 2 }
          });
        });

        it('returns row of a relatively large cell that contains specified delimiter', async () => {
          const csv = createCSV('a\n1\n"12345;67890"');
          const { warnings } = await parseCSV(i18n, csv, ['a'], {
            delimiter: ';'
          });
          warnings.should.eql({
            count: 1,
            details: { largeCell: 2 }
          });
        });

        it('returns the row of a relatively large cell that contains a newline', async () => {
          const csv = createCSV('a\n1\n"12345\n67890"');
          const { warnings } = await parseCSV(i18n, csv, ['a']);
          warnings.should.eql({
            count: 1,
            details: { largeCell: 2 }
          });
        });

        it('ignores cells that do not contain a delimiter or newline', async () => {
          const csv = createCSV('a\n1\n"12345.67890"');
          const { warnings } = await parseCSV(i18n, csv, ['a']);
          warnings.should.eql({
            count: 0,
            details: {}
          });
        });

        it('ignores cells that are not relatively large', async () => {
          const csv = createCSV('a,b\n1,2\n3,"12345,67890"');
          const { warnings } = await parseCSV(i18n, csv, ['a', 'b']);
          warnings.should.eql({
            count: 0,
            details: {}
          });
        });
      });

      it('returns multiple warnings', async () => {
        const csv = createCSV('a,b\n1\n"12345,67890",""');
        const { warnings } = await parseCSV(i18n, csv, ['a', 'b']);
        warnings.should.eql({
          count: 2,
          details: { raggedRows: [[1, 1]], largeCell: 2 }
        });
      });
    });
  });

  describe('formatCSVDelimiter()', () => {
    it('returns ⇥ for tab', () => {
      formatCSVDelimiter('\t').should.equal('⇥');
    });

    it('returns a comma as-is', () => {
      formatCSVDelimiter(',').should.equal(',');
    });
  });

  describe('formatCSVRow()', () => {
    it('returns a CSV string', () => {
      formatCSVRow(['1', '2']).should.eql('1,2');
    });

    it('encloses commas in quotes', () => {
      formatCSVRow(['1', '2,3', '4']).should.eql('1,"2,3",4');
    });

    it('escapes quotes', () => {
      formatCSVRow(['1', '2"3', '4']).should.eql('1,"2""3",4');
    });

    describe('delimiter', () => {
      it('uses the specified delimiter', () => {
        formatCSVRow(['1', '2;3'], { delimiter: ';' }).should.equal('1;"2;3"');
      });

      it('uses ⇥ instead of tab', () => {
        formatCSVRow(['1', '2\t3'], { delimiter: '\t' }).should.equal('1⇥"2⇥3"');
      });
    });

    it('truncates the string if there are too many elements', () => {
      formatCSVRow(['1', '2', '3', '4'], { maxLength: 2 }).should.eql('1,2,…');
    });

    it('truncates the string if it is too large', () => {
      const values = ['1', '23', '456'];
      formatCSVRow(values, { maxSize: 6 }).should.eql('1,23,456');
      formatCSVRow(values, { maxSize: 5 }).should.eql('1,23,45…');
      formatCSVRow(values, { maxSize: 4 }).should.eql('1,23,4…');
      formatCSVRow(values, { maxSize: 3 }).should.eql('1,23,…');
      formatCSVRow(values, { maxSize: 2 }).should.eql('1,2…');
      formatCSVRow(values, { maxSize: 1 }).should.eql('1,…');
    });

    it('truncates the string if both are true', () => {
      const values = ['1', '23', '456'];
      formatCSVRow(values, { maxLength: 2, maxSize: 2 }).should.eql('1,2…');
    });
  });
});
