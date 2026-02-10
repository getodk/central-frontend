import { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL';
import { beforeEach, describe, expect, it } from 'vitest';
import { parseItems } from '../../../../../src/parse/model/SecondaryInstance/sources/external-instance-csv-parser';

describe('external-instance-csv-parser', () => {
	let url: JRResourceURL;
	beforeEach(() => {
		url = JRResourceURL.create('csv', 'mock.csv');
	});

	it('parses empty csv', () => {
		const actual = parseItems(url, 'name,value');
		expect(actual).to.deep.equal([]);
	});

	const delimiters = [';', '\t', '|'];
	for (const delimiter of delimiters) {
		it(`parses columns with delimiter "${delimiter}"`, () => {
			const csv = `name${delimiter}value\na${delimiter}1`;
			const actual = parseItems(url, csv);
			expect(actual).to.deep.equal([
				[
					{ columnName: 'name', cellValue: 'a' },
					{ columnName: 'value', cellValue: '1' },
				],
			]);
		});
	}

	it('errors when given no columns', () => {
		expect(() => parseItems(url, '')).to.throw('Failed to parse CSV jr://csv/mock.csv');
	});

	it('errors when given null character in header', () => {
		expect(() => parseItems(url, 'f\0o,bar')).to.throw(
			'Failed to parse CSV jr://csv/mock.csv: null character'
		);
	});

	it('parses csv with rows with extra columns that are empty', () => {
		const csv = `name,value
a,1,,,,,,
`;
		const actual = parseItems(url, csv);
		expect(actual).to.deep.equal([
			[
				{
					cellValue: 'a',
					columnName: 'name',
				},
				{
					cellValue: '1',
					columnName: 'value',
				},
			],
		]);
	});

	it('errors when given row with extra columns with values', () => {
		const csv = `name,value
a,1,q
`;
		expect(() => parseItems(url, csv)).to.throw(
			'Failed to parse CSV jr://csv/mock.csv: row 1, expected 2 columns, got 3'
		);
	});

	it('strips empty trailing rows', () => {
		const csv = `name,value
a,1
c,2




`;
		const expected = [
			[
				{ columnName: 'name', cellValue: 'a' },
				{ columnName: 'value', cellValue: '1' },
			],
			[
				{ columnName: 'name', cellValue: 'c' },
				{ columnName: 'value', cellValue: '2' },
			],
		];
		const actual = parseItems(url, csv);
		expect(actual).to.deep.equal(expected);
	});

	it('gracefully handles empty rows', () => {
		const csv = `name,value
a,1
,
c,2`;
		const expected = [
			[
				{ columnName: 'name', cellValue: 'a' },
				{ columnName: 'value', cellValue: '1' },
			],
			[
				{ columnName: 'name', cellValue: '' },
				{ columnName: 'value', cellValue: '' },
			],
			[
				{ columnName: 'name', cellValue: 'c' },
				{ columnName: 'value', cellValue: '2' },
			],
		];

		const actual = parseItems(url, csv);
		expect(actual).to.deep.equal(expected);
	});
});
