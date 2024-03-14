import { expect, test } from '@playwright/test';
import { resolve as resolvePath } from 'node:path';
import Parser from 'web-tree-sitter';

const { describe } = test;
const it = test;

// TODO: This is currently exercising the WASM build of the grammar/parser, but
// the tests are currently running in Node(!). There probably isn't a
// substantial difference in behavior (although I'm pretty certain there is a
// difference affecting the nested expression detection logic, where I believe
// the browser implementation doesn't require checking `SyntaxNode` ids).
describe('Parsing subexpressions', () => {
	const typedAncestors = (types: Set<string>, node: Parser.SyntaxNode): Parser.SyntaxNode[] => {
		const ancestors: Parser.SyntaxNode[] = [];

		let current: Parser.SyntaxNode | null = node;

		while (current != null) {
			if (types.has(current.type)) {
				ancestors.push(current);
			}

			current = current.parent;
		}

		return ancestors;
	};

	let parser: Parser;
	let pathExpressionsQuery: Parser.Query;

	test.beforeAll(async () => {
		await Parser.init();
		parser = new Parser();

		const treeSitterXPathWasmPath = resolvePath(__dirname, '../tree-sitter-xpath.wasm');
		const XPath = await Parser.Language.load(treeSitterXPathWasmPath);

		parser.setLanguage(XPath);

		pathExpressionsQuery = XPath.query(/* clj */ `
				(absolute_location_path) @path.absolute

				(relative_location_path) @path.relative

				;; e.g. id("foo")
				(filter_path_expr
					(step)) @path.filter

				;; e.g. id("foo")/bar
				(filter_path_expr
					.
					(filter_expr
						(function_call
							name: (function_name) @function-name)
						(#eq? @function-name "id"))) @path.filter
		`);
	});

	[
		{
			expression: '/xpath/expression',
			expected: ['/xpath/expression'],
		},
		{
			expression: 'concat("Evaluates to: ", /xpath/expression)',
			expected: ['/xpath/expression'],
		},
		{
			expression: './author',
			expected: ['./author'],
		},
		{
			expression: 'author',
			expected: ['author'],
		},
		{
			expression: 'first.name',
			expected: ['first.name'],
		},
		{
			expression: '/bookstore',
			expected: ['/bookstore'],
		},
		{
			expression: '//author',
			expected: ['//author'],
		},
		{
			expression: 'author/first-name',
			expected: ['author/first-name'],
		},
		{
			expression: 'bookstore//title',
			expected: ['bookstore//title'],
		},
		{
			expression: 'bookstore/*/title',
			expected: ['bookstore/*/title'],
		},
		{
			expression: 'bookstore//book/excerpt//emph',
			expected: ['bookstore//book/excerpt//emph'],
		},
		{
			expression: './/title',
			expected: ['.//title'],
		},
		{
			expression: 'book/*/last-name',
			expected: ['book/*/last-name'],
		},
		{
			expression: '@style',
			expected: ['@style'],
		},
		{
			expression: 'price/@exchange',
			expected: ['price/@exchange'],
		},
		{
			expression: 'price/@exchange/total',
			expected: ['price/@exchange/total'],
		},
		{
			expression: 'book/@style',
			expected: ['book/@style'],
		},
		{
			expression: './first-name',
			expected: ['./first-name'],
		},
		{
			expression: 'first-name',
			expected: ['first-name'],
		},
		{
			expression: 'my:book',
			expected: ['my:book'],
		},
		{
			expression: '../../some-path',
			expected: ['../../some-path'],
		},
		{
			expression: '*/*',
			expected: ['*/*'],
		},
		{
			expression: '@*',
			expected: ['@*'],
		},
		{
			expression: '@my:*',
			expected: ['@my:*'],
		},
		{
			expression: 'my:*',
			expected: ['my:*'],
		},
		{
			expression: '/simple/xpath/to/node = 1',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/simple/xpath/to/node != 1',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/simple/xpath/to/node < 1',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/simple/xpath/to/node > 1',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/simple/xpath/to/node <= 1',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/simple/xpath/to/node >= 1',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/simple/xpath/to/node = "1"',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/simple/xpath/to/node != "1"',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression:
				"if(selected(/model/instance[1]/pregnancy/group_lmp/lmp_method, 'date'), /model/instance[1]/pregnancy/group_lmp/lmp_date, 'testing')",
			expected: [
				'/model/instance[1]/pregnancy/group_lmp/lmp_method',
				'/model/instance[1]/pregnancy/group_lmp/lmp_date',
			],
		},
		{
			expression:
				"if(selected(/model/instance[1]/pregnancy/group_lmp/lmp_method, 'date'), /model/instance[1]/pregnancy/group_lmp/lmp_date, concat('testing', '1', '2', '3', '...'))",
			expected: [
				'/model/instance[1]/pregnancy/group_lmp/lmp_method',
				'/model/instance[1]/pregnancy/group_lmp/lmp_date',
			],
		},
		{
			expression:
				"if(selected(/model/instance[1]/pregnancy/group_lmp/lmp_method, 'date'), /model/instance[1]/pregnancy/group_lmp/lmp_date, date-time(0))",
			expected: [
				'/model/instance[1]/pregnancy/group_lmp/lmp_method',
				'/model/instance[1]/pregnancy/group_lmp/lmp_date',
			],
		},
		{
			expression:
				"if(selected(/model/instance[1]/pregnancy/group_lmp/lmp_method, 'date'), /model/instance[1]/pregnancy/group_lmp/lmp_date, date-time(decimal-date-time(today() - 60)))",
			expected: [
				'/model/instance[1]/pregnancy/group_lmp/lmp_method',
				'/model/instance[1]/pregnancy/group_lmp/lmp_date',
			],
		},
		{
			expression:
				"if(selected(/model/instance[1]/pregnancy/group_lmp/lmp_method ,'date'), /model/instance[1]/pregnancy/group_lmp/lmp_date ,date-time(decimal-date-time(today()- 60 )))",
			expected: [
				'/model/instance[1]/pregnancy/group_lmp/lmp_method',
				'/model/instance[1]/pregnancy/group_lmp/lmp_date',
			],
		},
		{
			expression: "if(/something, 'A', 'B' )",
			expected: ['/something'],
		},
		{
			expression: "if(/something  != '', 'A', 'B' )",
			expected: ['/something'],
		},
		{
			expression: "if (/something, 'A', 'B' )",
			expected: ['/something'],
		},
		{
			expression: "if (/something  != '', 'A', 'B' )",
			expected: ['/something'],
		},
		{
			expression: "not(selected(../dob_method,'approx'))",
			expected: ['../dob_method'],
		},
		{
			expression: "not(not(selected(../dob_method,'approx')))",
			expected: ['../dob_method'],
		},
		{
			expression: "selected(../dob_method,'approx')",
			expected: ['../dob_method'],
		},
		{
			expression: '.',
			expected: ['.'],
		},
		{
			expression: '.>1',
			expected: ['.'],
		},
		{
			expression: '.> 1',
			expected: ['.'],
		},
		{
			expression: '. >1',
			expected: ['.'],
		},
		{
			expression: '. > 1',
			expected: ['.'],
		},
		{
			expression: '.>=1',
			expected: ['.'],
		},
		{
			expression: '.>= 1',
			expected: ['.'],
		},
		{
			expression: '. >=1',
			expected: ['.'],
		},
		{
			expression: '. >= 1',
			expected: ['.'],
		},
		{
			expression: '.<1',
			expected: ['.'],
		},
		{
			expression: '.< 1',
			expected: ['.'],
		},
		{
			expression: '. <1',
			expected: ['.'],
		},
		{
			expression: '. < 1',
			expected: ['.'],
		},
		{
			expression: '.<=1',
			expected: ['.'],
		},
		{
			expression: '.<= 1',
			expected: ['.'],
		},
		{
			expression: '. <=1',
			expected: ['.'],
		},
		{
			expression: '. <= 1',
			expected: ['.'],
		},
		{
			expression: "../some-path='some-value'",
			expected: ['../some-path'],
		},
		{
			expression: '../some-path="some-value"',
			expected: ['../some-path'],
		},
		{
			expression: "../some-path= 'some-value'",
			expected: ['../some-path'],
		},
		{
			expression: "../some-path ='some-value'",
			expected: ['../some-path'],
		},
		{
			expression: "../some-path = 'some-value'",
			expected: ['../some-path'],
		},
		{
			expression: "'some-value'=../some-path",
			expected: ['../some-path'],
		},
		{
			expression: '"some-value"=../some-path',
			expected: ['../some-path'],
		},
		{
			expression: "'some-value'= ../some-path",
			expected: ['../some-path'],
		},
		{
			expression: "'some-value' =../some-path",
			expected: ['../some-path'],
		},
		{
			expression: "'some-value' = ../some-path",
			expected: ['../some-path'],
		},
		{
			expression: '/simple/xpath/to/node < today() + 1',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/simple/xpath/to/node > today() + 1',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/simple/xpath/to/node > today() - 1',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/simple/xpath/to/node < today() - 1',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/simple/xpath/to/node < (today() + 1)',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/simple/xpath/to/node > (today() + 1)',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/simple/xpath/to/node > (today() - 1)',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/simple/xpath/to/node < (today() - 1)',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/data/a!= /data/b',
			expected: ['/data/a', '/data/b'],
		},
		{
			expression: '/data/a!=/data/b',
			expected: ['/data/a', '/data/b'],
		},
		{
			expression: '/data/a!= "1"',
			expected: ['/data/a'],
		},
		{
			expression: '/data/a!="1"',
			expected: ['/data/a'],
		},
		{
			expression: '"1" != /data/a',
			expected: ['/data/a'],
		},
		{
			expression: '"1"!= /data/a',
			expected: ['/data/a'],
		},
		{
			expression: '"1"!=/data/a',
			expected: ['/data/a'],
		},
		{
			expression: '/data/a<= /data/b',
			expected: ['/data/a', '/data/b'],
		},
		{
			expression: '/data/a<=/data/b',
			expected: ['/data/a', '/data/b'],
		},
		{
			expression: '/data/a<= "1"',
			expected: ['/data/a'],
		},
		{
			expression: '/data/a<="1"',
			expected: ['/data/a'],
		},
		{
			expression: '"1" <= /data/a',
			expected: ['/data/a'],
		},
		{
			expression: '"1"<= /data/a',
			expected: ['/data/a'],
		},
		{
			expression: '"1"<=/data/a',
			expected: ['/data/a'],
		},
		{
			expression: '/data/a>= /data/b',
			expected: ['/data/a', '/data/b'],
		},
		{
			expression: '/data/a>=/data/b',
			expected: ['/data/a', '/data/b'],
		},
		{
			expression: '/data/a>= "1"',
			expected: ['/data/a'],
		},
		{
			expression: '/data/a>="1"',
			expected: ['/data/a'],
		},
		{
			expression: '"1" >= /data/a',
			expected: ['/data/a'],
		},
		{
			expression: '"1">= /data/a',
			expected: ['/data/a'],
		},
		{
			expression: '"1">=/data/a',
			expected: ['/data/a'],
		},
		{
			expression: '/data/number + 1',
			expected: ['/data/number'],
		},
		{
			expression: '/data/number+1',
			expected: ['/data/number'],
		},
		{
			expression: '../number + 1',
			expected: ['../number'],
		},
		{
			expression: '../number+1',
			expected: ['../number'],
		},
		{
			expression: 'boolean(/xhtml:html)',
			expected: ['/xhtml:html'],
		},
		{
			expression: 'boolean(/asdf)',
			expected: ['/asdf'],
		},
		{
			expression: 'boolean(//xhtml:article)',
			expected: ['//xhtml:article'],
		},
		{
			expression: '-10 = *',
			expected: ['*'],
		},
		{
			expression: '-10 != *',
			expected: ['*'],
		},
		{
			expression: '4 = *',
			expected: ['*'],
		},
		{
			expression: '4 != *',
			expected: ['*'],
		},
		{
			expression: '4.3 = *',
			expected: ['*'],
		},
		{
			expression: '4.3 != *',
			expected: ['*'],
		},
		{
			expression: 'true() = *',
			expected: ['*'],
		},
		{
			expression: 'true() != *',
			expected: ['*'],
		},
		{
			expression: 'false() = *',
			expected: ['*'],
		},
		{
			expression: 'false() != *',
			expected: ['*'],
		},
		{
			expression: '0 = *',
			expected: ['*'],
		},
		{
			expression: '0 != *',
			expected: ['*'],
		},
		{
			expression: "'aaa' = *",
			expected: ['*'],
		},
		{
			expression: "'aaa' != *",
			expected: ['*'],
		},
		{
			expression: "'bb' = *",
			expected: ['*'],
		},
		{
			expression: "'bb' != *",
			expected: ['*'],
		},
		{
			expression: "'' = *",
			expected: ['*'],
		},
		{
			expression: "'' != *",
			expected: ['*'],
		},
		{
			expression: '-10 < *',
			expected: ['*'],
		},
		{
			expression: '-10 <= *',
			expected: ['*'],
		},
		{
			expression: '-10 > *',
			expected: ['*'],
		},
		{
			expression: '-10 >= *',
			expected: ['*'],
		},
		{
			expression: '10 < *',
			expected: ['*'],
		},
		{
			expression: '10 <= *',
			expected: ['*'],
		},
		{
			expression: '10 > *',
			expected: ['*'],
		},
		{
			expression: '10 >= *',
			expected: ['*'],
		},
		{
			expression: '5 < *',
			expected: ['*'],
		},
		{
			expression: '5 <= *',
			expected: ['*'],
		},
		{
			expression: '5 > *',
			expected: ['*'],
		},
		{
			expression: '5 >= *',
			expected: ['*'],
		},
		{
			expression: '2 < *',
			expected: ['*'],
		},
		{
			expression: '2 <= *',
			expected: ['*'],
		},
		{
			expression: '2 > *',
			expected: ['*'],
		},
		{
			expression: '2 >= *',
			expected: ['*'],
		},
		{
			expression: 'true() < *',
			expected: ['*'],
		},
		{
			expression: 'true() <= *',
			expected: ['*'],
		},
		{
			expression: 'true() > *',
			expected: ['*'],
		},
		{
			expression: 'true() >= *',
			expected: ['*'],
		},
		{
			expression: 'false() < *',
			expected: ['*'],
		},
		{
			expression: 'false() <= *',
			expected: ['*'],
		},
		{
			expression: 'false() > *',
			expected: ['*'],
		},
		{
			expression: 'false() >= *',
			expected: ['*'],
		},
		{
			expression: "'4' < *",
			expected: ['*'],
		},
		{
			expression: "'4' <= *",
			expected: ['*'],
		},
		{
			expression: "'4' > *",
			expected: ['*'],
		},
		{
			expression: "'4' >= *",
			expected: ['*'],
		},
		{
			expression: '* < -10',
			expected: ['*'],
		},
		{
			expression: '* <= -10',
			expected: ['*'],
		},
		{
			expression: '* > -10',
			expected: ['*'],
		},
		{
			expression: '* >= -10',
			expected: ['*'],
		},
		{
			expression: '* < 10',
			expected: ['*'],
		},
		{
			expression: '* <= 10',
			expected: ['*'],
		},
		{
			expression: '* > 10',
			expected: ['*'],
		},
		{
			expression: '* >= 10',
			expected: ['*'],
		},
		{
			expression: '* < 5',
			expected: ['*'],
		},
		{
			expression: '* <= 5',
			expected: ['*'],
		},
		{
			expression: '* > 5',
			expected: ['*'],
		},
		{
			expression: '* >= 5',
			expected: ['*'],
		},
		{
			expression: '* < 2',
			expected: ['*'],
		},
		{
			expression: '* <= 2',
			expected: ['*'],
		},
		{
			expression: '* > 2',
			expected: ['*'],
		},
		{
			expression: '* >= 2',
			expected: ['*'],
		},
		{
			expression: '* < true()',
			expected: ['*'],
		},
		{
			expression: '* <= true()',
			expected: ['*'],
		},
		{
			expression: '* > true()',
			expected: ['*'],
		},
		{
			expression: '* >= true()',
			expected: ['*'],
		},
		{
			expression: '* < false()',
			expected: ['*'],
		},
		{
			expression: '* <= false()',
			expected: ['*'],
		},
		{
			expression: '* > false()',
			expected: ['*'],
		},
		{
			expression: '* >= false()',
			expected: ['*'],
		},
		{
			expression: "* < '4'",
			expected: ['*'],
		},
		{
			expression: "* <= '4'",
			expected: ['*'],
		},
		{
			expression: "* > '4'",
			expected: ['*'],
		},
		{
			expression: "* >= '4'",
			expected: ['*'],
		},
		{
			expression: "* < 'aaa'",
			expected: ['*'],
		},
		{
			expression: "* <= 'aaa'",
			expected: ['*'],
		},
		{
			expression: "* > 'aaa'",
			expected: ['*'],
		},
		{
			expression: "* >= 'aaa'",
			expected: ['*'],
		},
		{
			expression: "'aaa' < *",
			expected: ['*'],
		},
		{
			expression: "'aaa' <= *",
			expected: ['*'],
		},
		{
			expression: "'aaa' > *",
			expected: ['*'],
		},
		{
			expression: "'aaa' >= *",
			expected: ['*'],
		},
		{
			expression: '0 < *',
			expected: ['*'],
		},
		{
			expression: '0 <= *',
			expected: ['*'],
		},
		{
			expression: '0 > *',
			expected: ['*'],
		},
		{
			expression: '0 >= *',
			expected: ['*'],
		},
		{
			expression: "'' < *",
			expected: ['*'],
		},
		{
			expression: "'' <= *",
			expected: ['*'],
		},
		{
			expression: "'' > *",
			expected: ['*'],
		},
		{
			expression: "'' >= *",
			expected: ['*'],
		},
		{
			expression: '* < 0',
			expected: ['*'],
		},
		{
			expression: '* <= 0',
			expected: ['*'],
		},
		{
			expression: '* > 0',
			expected: ['*'],
		},
		{
			expression: '* >= 0',
			expected: ['*'],
		},
		{
			expression: "* < ''",
			expected: ['*'],
		},
		{
			expression: "* <= ''",
			expected: ['*'],
		},
		{
			expression: "* > ''",
			expected: ['*'],
		},
		{
			expression: "* >= ''",
			expected: ['*'],
		},
		{
			expression: '* = -10',
			expected: ['*'],
		},
		{
			expression: '* = 4',
			expected: ['*'],
		},
		{
			expression: '* = 4.3',
			expected: ['*'],
		},
		{
			expression: '* = 0',
			expected: ['*'],
		},
		{
			expression: '* = true()',
			expected: ['*'],
		},
		{
			expression: '* = false()',
			expected: ['*'],
		},
		{
			expression: "* = 'aaa'",
			expected: ['*'],
		},
		{
			expression: "* = 'bb'",
			expected: ['*'],
		},
		{
			expression: "* = ''",
			expected: ['*'],
		},
		{
			expression: '* != -10',
			expected: ['*'],
		},
		{
			expression: '* != 4',
			expected: ['*'],
		},
		{
			expression: '* != 4.3',
			expected: ['*'],
		},
		{
			expression: '* != 0',
			expected: ['*'],
		},
		{
			expression: '* != true()',
			expected: ['*'],
		},
		{
			expression: '* != false()',
			expected: ['*'],
		},
		{
			expression: "* != 'aaa'",
			expected: ['*'],
		},
		{
			expression: "* != 'bb'",
			expected: ['*'],
		},
		{
			expression: "* != ''",
			expected: ['*'],
		},
		{
			expression:
				"id('ComparisonOperatorCaseNodesetNegative5to5')/* < id('ComparisonOperatorCaseNodesetEmpty')/*",
			expected: [
				"id('ComparisonOperatorCaseNodesetNegative5to5')/*",
				"id('ComparisonOperatorCaseNodesetEmpty')/*",
			],
		},
		{
			expression:
				"id ('ComparisonOperatorCaseNodesetNegative5to5')/* < id( 'ComparisonOperatorCaseNodesetEmpty')/*",
			expected: [
				"id ('ComparisonOperatorCaseNodesetNegative5to5')/*",
				"id( 'ComparisonOperatorCaseNodesetEmpty')/*",
			],
		},
		{
			expression:
				"id ( 'ComparisonOperatorCaseNodesetNegative5to5' )/* < id( 'ComparisonOperatorCaseNodesetEmpty' )/*",
			expected: [
				"id ( 'ComparisonOperatorCaseNodesetNegative5to5' )/*",
				"id( 'ComparisonOperatorCaseNodesetEmpty' )/*",
			],
		},
		{
			expression:
				"id('ComparisonOperatorCaseNodesetNegative5to5')/* <= id('ComparisonOperatorCaseNodesetEmpty')/*",
			expected: [
				"id('ComparisonOperatorCaseNodesetNegative5to5')/*",
				"id('ComparisonOperatorCaseNodesetEmpty')/*",
			],
		},
		{
			expression:
				"id('ComparisonOperatorCaseNodesetNegative5to5')/* > id('ComparisonOperatorCaseNodesetEmpty')/*",
			expected: [
				"id('ComparisonOperatorCaseNodesetNegative5to5')/*",
				"id('ComparisonOperatorCaseNodesetEmpty')/*",
			],
		},
		{
			expression:
				"id('ComparisonOperatorCaseNodesetNegative5to5')/* >= id('ComparisonOperatorCaseNodesetEmpty')/*",
			expected: [
				"id('ComparisonOperatorCaseNodesetNegative5to5')/*",
				"id('ComparisonOperatorCaseNodesetEmpty')/*",
			],
		},
		{
			expression:
				"id('ComparisonOperatorCaseNodesetNegative5to5')/* < id('ComparisonOperatorCaseNodeset4to8')/*",
			expected: [
				"id('ComparisonOperatorCaseNodesetNegative5to5')/*",
				"id('ComparisonOperatorCaseNodeset4to8')/*",
			],
		},
		{
			expression:
				"id('ComparisonOperatorCaseNodesetNegative5to5')/* <= id('ComparisonOperatorCaseNodeset4to8')/*",
			expected: [
				"id('ComparisonOperatorCaseNodesetNegative5to5')/*",
				"id('ComparisonOperatorCaseNodeset4to8')/*",
			],
		},
		{
			expression:
				"id('ComparisonOperatorCaseNodesetNegative5to5')/* > id('ComparisonOperatorCaseNodeset4to8')/*",
			expected: [
				"id('ComparisonOperatorCaseNodesetNegative5to5')/*",
				"id('ComparisonOperatorCaseNodeset4to8')/*",
			],
		},
		{
			expression:
				"id('ComparisonOperatorCaseNodesetNegative5to5')/* >= id('ComparisonOperatorCaseNodeset4to8')/*",
			expected: [
				"id('ComparisonOperatorCaseNodesetNegative5to5')/*",
				"id('ComparisonOperatorCaseNodeset4to8')/*",
			],
		},
		{
			expression:
				"id('ComparisonOperatorCaseNodesetNegative5to5')/* < id('ComparisonOperatorCaseNodeset6to10')/*",
			expected: [
				"id('ComparisonOperatorCaseNodesetNegative5to5')/*",
				"id('ComparisonOperatorCaseNodeset6to10')/*",
			],
		},
		{
			expression:
				"id('ComparisonOperatorCaseNodesetNegative5to5')/* <= id('ComparisonOperatorCaseNodeset6to10')/*",
			expected: [
				"id('ComparisonOperatorCaseNodesetNegative5to5')/*",
				"id('ComparisonOperatorCaseNodeset6to10')/*",
			],
		},
		{
			expression:
				"id('ComparisonOperatorCaseNodesetNegative5to5')/* > id('ComparisonOperatorCaseNodeset6to10')/*",
			expected: [
				"id('ComparisonOperatorCaseNodesetNegative5to5')/*",
				"id('ComparisonOperatorCaseNodeset6to10')/*",
			],
		},
		{
			expression:
				"id('ComparisonOperatorCaseNodesetNegative5to5')/* >= id('ComparisonOperatorCaseNodeset6to10')/*",
			expected: [
				"id('ComparisonOperatorCaseNodesetNegative5to5')/*",
				"id('ComparisonOperatorCaseNodeset6to10')/*",
			],
		},
		{
			expression: '/thedata/processing-instructionA',
			expected: ['/thedata/processing-instructionA'],
		},
		{
			expression: '/thedata/nodeA',
			expected: ['/thedata/nodeA'],
		},
		{
			expression: '/thedata/nodea',
			expected: ['/thedata/nodea'],
		},
		{
			expression: '/thedata/no-dea',
			expected: ['/thedata/no-dea'],
		},
		{
			expression: '/thedata/nodeB',
			expected: ['/thedata/nodeB'],
		},
		{
			expression: '/thedata/nodeC',
			expected: ['/thedata/nodeC'],
		},
		{
			expression: '/model/instance[1]/*//*[@template] | /model/instance[1]/*//*[@jr:template]',
			expected: ['/model/instance[1]/*//*[@template]', '/model/instance[1]/*//*[@jr:template]'],
		},
		{
			expression: 'attribute::*',
			expected: ['attribute::*'],
		},
		{
			expression: 'child::*',
			expected: ['child::*'],
		},
		{
			expression: 'ancestor-or-self::*',
			expected: ['ancestor-or-self::*'],
		},
		{
			expression: 'attribute::attrib3',
			expected: ['attribute::attrib3'],
		},
		{
			expression: 'child::html',
			expected: ['child::html'],
		},
		{
			expression: 'child::xhtml:html',
			expected: ['child::xhtml:html'],
		},
		{
			expression: 'ancestor::xhtml:div',
			expected: ['ancestor::xhtml:div'],
		},
		{
			expression: 'ancestor::div',
			expected: ['ancestor::div'],
		},
		{
			expression: 'id(.)',
			expected: ['id(.)'],
		},
		{
			expression: 'id(child::*)',
			expected: ['id(child::*)'],
		},
		{
			expression: 'local-name(/htmlnot)',
			expected: ['/htmlnot'],
		},
		{
			expression: 'namespace-uri(/htmlnot)',
			expected: ['/htmlnot'],
		},
		{
			expression: 'name(/htmlnot)',
			expected: ['/htmlnot'],
		},
		{
			expression: 'last()',
			expected: [],
		},
		{
			expression: 'last()-last()+1',
			expected: [],
		},
		{
			expression: 'position()=last()',
			expected: [],
		},
		{
			expression: 'position()=2',
			expected: [],
		},
		{
			expression: 'position()=-1',
			expected: [],
		},
		{
			expression: 'count(xhtml:p)',
			expected: ['xhtml:p'],
		},
		{
			expression: '1 + count(xhtml:p)',
			expected: ['xhtml:p'],
		},
		{
			expression: 'count(p)',
			expected: ['p'],
		},
		{
			expression: '1 + count(p)',
			expected: ['p'],
		},
		{
			expression: 'count(//nonexisting)',
			expected: ['//nonexisting'],
		},
		{
			expression: '1 + count(//nonexisting)',
			expected: ['//nonexisting'],
		},
		{
			expression: 'number(*)',
			expected: ['*'],
		},
		{
			expression: 'sum(self::*)',
			expected: ['self::*'],
		},
		{
			expression: 'sum(*)',
			expected: ['*'],
		},
		{
			expression: '/',
			expected: ['/'],
		},
		{
			expression: '/html',
			expected: ['/html'],
		},
		{
			expression: '/xhtml:html',
			expected: ['/xhtml:html'],
		},
		{
			expression: '/htmlnot',
			expected: ['/htmlnot'],
		},
		{
			expression: '/xhtml:html/xhtml:body',
			expected: ['/xhtml:html/xhtml:body'],
		},
		{
			expression: 'html',
			expected: ['html'],
		},
		{
			expression: 'xhtml:html',
			expected: ['xhtml:html'],
		},
		{
			expression: 'xhtml:html/xhtml:body',
			expected: ['xhtml:html/xhtml:body'],
		},
		{
			expression: 'child::*/attribute::*',
			expected: ['child::*/attribute::*'],
		},
		{
			expression: 'child::*/ attribute :: *',
			expected: ['child::*/ attribute :: *'],
		},
		{
			expression: 'ancestor-or-self::* /ancestor-or-self::*',
			expected: ['ancestor-or-self::* /ancestor-or-self::*'],
		},
		{
			expression: 'string(namespace-uri(/*))',
			expected: ['/*'],
		},
		{
			expression: 'translate( ., "abc", "ABC")',
			expected: ['.'],
		},
		{
			expression: 'string(/htmlnot)',
			expected: ['/htmlnot'],
		},
		{
			expression: "id('nss25')/namespace::*",
			expected: ["id('nss25')/namespace::*"],
		},
		{
			expression: "id('nss25')/namespace::* | id('nss25')/attribute::*",
			expected: ["id('nss25')/namespace::*", "id('nss25')/attribute::*"],
		},
		{
			expression: "id('nss40')/namespace::*",
			expected: ["id('nss40')/namespace::*"],
		},
		{
			expression: "id('nss40')/namespace::* | id('nss40')/namespace::*",
			expected: ["id('nss40')/namespace::*", "id('nss40')/namespace::*"],
		},
		{
			expression: "id('nss40')/namespace::* | id('nss25')/attribute::* | id('nss25')",
			expected: ["id('nss40')/namespace::*", "id('nss25')/attribute::*", "id('nss25')"],
		},
		{
			expression: "/div/div/div/div/div|id('eee20')",
			expected: ['/div/div/div/div/div', "id('eee20')"],
		},
		{
			expression: "id('eee40')/attribute::*",
			expected: ["id('eee40')/attribute::*"],
		},
		{
			expression: '/div',
			expected: ['/div'],
		},
		{
			expression: '/adiv',
			expected: ['/adiv'],
		},
		{
			expression: '/adivb',
			expected: ['/adivb'],
		},
		{
			expression: '/divb',
			expected: ['/divb'],
		},
		{
			expression: '/mod',
			expected: ['/mod'],
		},
		{
			expression: '/*',
			expected: ['/*'],
		},
		{
			expression: '/pref:*',
			expected: ['/pref:*'],
		},
		{
			expression: '/div:*',
			expected: ['/div:*'],
		},
		{
			expression: '/mod:*',
			expected: ['/mod:*'],
		},
		{
			expression: '/@div',
			expected: ['/@div'],
		},
		{
			expression: '/@mod',
			expected: ['/@mod'],
		},
		{
			expression: '/@*',
			expected: ['/@*'],
		},
		{
			expression: '/@pref:*',
			expected: ['/@pref:*'],
		},
		{
			expression: '/@div:*',
			expected: ['/@div:*'],
		},
		{
			expression: '/@mod:*',
			expected: ['/@mod:*'],
		},
		{
			expression: '1or1',
			expected: [],
		},
		{
			expression: 'area(./*)',
			expected: ['./*'],
		},
		{
			expression: 'distance(./*)',
			expected: ['./*'],
		},
		{
			expression: 'area(.)',
			expected: ['.'],
		},
		{
			expression: 'distance(.)',
			expected: ['.'],
		},
		{
			expression: 'checklist(2, 2, * )',
			expected: ['*'],
		},
		{
			expression: 'coalesce(/simple/xpath/to/node, "whatever")',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'coalesce("", /simple/xpath/to/node)',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'coalesce(/simple/empty, /simple/xpath/to/node)',
			expected: ['/simple/empty', '/simple/xpath/to/node'],
		},
		{
			expression: 'coalesce(/simple/xpath/to/node, "SECOND")',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: "coalesce(self::*, 'ab')",
			expected: ['self::*'],
		},
		{
			expression: "coalesce(self::*, 'cd')",
			expected: ['self::*'],
		},
		{
			expression: 'concat(/simple/xpath/to/node, /simple/xpath/to/node)',
			expected: ['/simple/xpath/to/node', '/simple/xpath/to/node'],
		},
		{
			expression: 'concat(/simple/xpath/to/node, "manteau")',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: "concat(*, 'a')",
			expected: ['*'],
		},
		{
			expression: 'concat(*)',
			expected: ['*'],
		},
		{
			expression: '@id="FunctionCountNonEmpty"',
			expected: ['@id'],
		},
		{
			expression: '@id="NoExist"',
			expected: ['@id'],
		},
		{
			expression: ". < date('2012-07-24')",
			expected: ['.'],
		},
		{
			expression: ". < date-time('2012-07-24')",
			expected: ['.'],
		},
		{
			expression: "@id='FunctionDateCase2'",
			expected: ['@id'],
		},
		{
			expression: "@id='FunctionDateCase3'",
			expected: ['@id'],
		},
		{
			expression: ". = date('2012-07-24') - 1",
			expected: ['.'],
		},
		{
			expression: ". = date-time('2012-07-24') - 1",
			expected: ['.'],
		},
		{
			expression: ". > date('2012-07-24') - 2",
			expected: ['.'],
		},
		{
			expression: ". > date-time('2012-07-24') - 2",
			expected: ['.'],
		},
		{
			expression: ". < date('2012-07-25') - 1",
			expected: ['.'],
		},
		{
			expression: ". < date-time('2012-07-25') - 1",
			expected: ['.'],
		},
		{
			expression: "@id='FunctionDate'",
			expected: ['@id'],
		},
		{
			expression: "@id='FunctionDateCase4'",
			expected: ['@id'],
		},
		{
			expression: 'decimal-time( /data/a )',
			expected: ['/data/a'],
		},
		{
			expression: 'ends-with( /data/a, "cab")',
			expected: ['/data/a'],
		},
		{
			expression: 'format-date(.,  "%Y/%n | %y/%m | %b" )',
			expected: ['.'],
		},
		{
			expression: 'format-date-time(.,  "%Y/%n | %y/%m | %b" )',
			expected: ['.'],
		},
		{
			expression: 'format-date(., "%Y/%n | %y/%m | %b" )',
			expected: ['.'],
		},
		{
			expression: 'format-date-time(., "%Y/%n | %y/%m | %b" )',
			expected: ['.'],
		},
		{
			expression: 'format-date(., "%M | %S | %3")',
			expected: ['.'],
		},
		{
			expression: 'format-date-time(., "%M | %S | %3")',
			expected: ['.'],
		},
		{
			expression: 'if(/unreal, "exists", "does not exist")',
			expected: ['/unreal'],
		},
		{
			expression: '. != "0" and /div/div[@id="FunctionCheckListCaseEmpty"] != ""',
			expected: ['.', '/div/div[@id="FunctionCheckListCaseEmpty"]'],
		},
		{
			expression: 'if(. != "0" and /div/div[@id="FunctionCheckListCaseEmpty"] != "", "yes", "no")',
			expected: ['.', '/div/div[@id="FunctionCheckListCaseEmpty"]'],
		},
		{
			expression: '@id="FunctionCheckListCaseEmpty"',
			expected: ['@id'],
		},
		{
			expression: '@id="FunctionChecklistCaseNo"',
			expected: ['@id'],
		},
		{
			expression: 'if(. = "0" or /div/div[@id="FunctionCheckListCaseEmpty"] != "", "yes", "no")',
			expected: ['.', '/div/div[@id="FunctionCheckListCaseEmpty"]'],
		},
		{
			expression:
				'if( /model/instance[1]/data/page-welcome/GRP_ELIG/AGE_IC ="1" and /model/instance[1]/data/page-welcome/GRP_ELIG/INC_TEMP ="1" and /model/instance[1]/data/page-welcome/GRP_ELIG/NO_SEV_ILLNESS ="1" and /model/instance[1]/data/page-welcome/GRP_ELIG/FU_POSSIBLE ="1" and /model/instance[1]/data/page-welcome/GRP_ELIG/SAMPLE_COL_POSSIBLE ="1" and /model/instance[1]/data/page-welcome/GRP_ELIG/PROVIDE_INFORM_CONSENT ="1" and /model/instance[1]/data/page-welcome/GRP_ELIG/FEVER_RESP ="1", "Eligible", if( /model/instance[1]/data/page-welcome/GRP_ELIG/AGE_IC ="0" or /model/instance[1]/data/page-welcome/GRP_ELIG/INC_TEMP ="0" or /model/instance[1]/data/page-welcome/GRP_ELIG/NO_SEV_ILLNESS ="0" or /model/instance[1]/data/page-welcome/GRP_ELIG/FU_POSSIBLE ="0" or /model/instance[1]/data/page-welcome/GRP_ELIG/SAMPLE_COL_POSSIBLE ="0" or /model/instance[1]/data/page-welcome/GRP_ELIG/PROVIDE_INFORM_CONSENT ="0" or /model/instance[1]/data/page-welcome/GRP_ELIG/FEVER_RESP ="0", "Not-Eligible", "nothing"))',
			expected: [
				'/model/instance[1]/data/page-welcome/GRP_ELIG/AGE_IC',
				'/model/instance[1]/data/page-welcome/GRP_ELIG/AGE_IC',
				'/model/instance[1]/data/page-welcome/GRP_ELIG/AGE_IC',
				'/model/instance[1]/data/page-welcome/GRP_ELIG/INC_TEMP',
				'/model/instance[1]/data/page-welcome/GRP_ELIG/NO_SEV_ILLNESS',
				'/model/instance[1]/data/page-welcome/GRP_ELIG/FU_POSSIBLE',
				'/model/instance[1]/data/page-welcome/GRP_ELIG/SAMPLE_COL_POSSIBLE',
				'/model/instance[1]/data/page-welcome/GRP_ELIG/PROVIDE_INFORM_CONSENT',
				'/model/instance[1]/data/page-welcome/GRP_ELIG/FEVER_RESP',
			],
		},
		{
			expression:
				'if( /data/a ="1" and /data/b ="1", "Eligible", if( /data/a ="0" or /data/b ="0", "Not-Eligible", "nothing"))',
			expected: ['/data/a', '/data/b'],
		},
		{
			expression:
				'if( /data/a ="1" and /data/c ="1", "Eligible", if( /data/a ="0" or /data/b ="0", "Not-Eligible", "nothing"))',
			expected: ['/data/a', '/data/c', '/data/b'],
		},
		{
			expression:
				'if( /data/c ="1" and /data/b ="1", "Eligible", if( /data/a ="0" or /data/b ="0", "Not-Eligible", "nothing"))',
			expected: ['/data/c', '/data/b', '/data/a'],
		},
		{
			expression:
				'if( /data/a ="1" and /data/b ="1", "Eligible", if( /data/a ="0" or /data/d ="0", "Not-Eligible", "nothing"))',
			expected: ['/data/a', '/data/b', '/data/d'],
		},
		{
			expression:
				'if( /data/a ="1" and /data/b ="1", "Eligible", if( /data/d ="0" or /data/b ="0", "Not-Eligible", "nothing"))',
			expected: ['/data/a', '/data/b', '/data/d'],
		},
		{
			expression: 'count( if(true(), //b, //a ))',
			expected: ['//b', '//a'],
		},
		{
			expression: 'count ( if(true(), //b, //a ))',
			expected: ['//b', '//a'],
		},
		{
			expression: 'some-fn ( if(true(), //b, //a ))',
			expected: ['//b', '//a'],
		},
		{
			expression: 'int(/simple/xpath/to/node)',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'join(" :: ", //item)',
			expected: ['//item'],
		},
		{
			expression: 'join(", ", //item)',
			expected: ['//item'],
		},
		{
			expression: 'join(", ", /root/*)',
			expected: ['/root/*'],
		},
		{
			expression: 'join(", ", *)',
			expected: ['*'],
		},
		{
			expression: 'max(//nonexisting)',
			expected: ['//nonexisting'],
		},
		{
			expression: 'max(/simple)',
			expected: ['/simple'],
		},
		{
			expression: 'max(/simple/xpath/to/node)',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'max(/root/item)',
			expected: ['/root/item'],
		},
		{
			expression: 'max(self::*)',
			expected: ['self::*'],
		},
		{
			expression: 'max(*)',
			expected: ['*'],
		},
		{
			expression: 'min(//nonexisting)',
			expected: ['//nonexisting'],
		},
		{
			expression: 'min(/simple)',
			expected: ['/simple'],
		},
		{
			expression: 'min(/simple/xpath/to/node)',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'min(/root/item)',
			expected: ['/root/item'],
		},
		{
			expression: 'min(self::*)',
			expected: ['self::*'],
		},
		{
			expression: 'min(*)',
			expected: ['*'],
		},
		{
			expression: 'not(/cities)',
			expected: ['/cities'],
		},
		{
			expression: 'not(not(/cities))',
			expected: ['/cities'],
		},
		{
			expression: 'not(/countries)',
			expected: ['/countries'],
		},
		{
			expression: 'not(not(/countries))',
			expected: ['/countries'],
		},
		{
			expression: 'once(. * 10)',
			expected: ['.'],
		},
		{
			expression: 'position(..)',
			expected: ['..'],
		},
		{
			expression: 'position(.)',
			expected: ['.'],
		},
		{
			expression: 'position(../..)',
			expected: ['../..'],
		},
		{
			expression: 'pow(/simple/xpath/to/node, 0)',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'pow(/simple/xpath/to/node, 3)',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'pow(/simple/xpath/to/node, 2)',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '@id="FunctionRandomize"',
			expected: ['@id'],
		},
		{
			expression: '@id="testFunctionNodeset2"',
			expected: ['@id'],
		},
		{
			expression: '@id="crop_list"',
			expected: ['@id'],
		},
		{
			expression: 'regex(/simple/xpath/to/node, "[0-9]{3}")',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'selected(/simple/xpath/to/node, "one")',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'selected(/simple/xpath/to/node, "two")',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'selected(/simple/xpath/to/node, "three")',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'selected(/simple/xpath/to/node, "on")',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'selected(/simple/xpath/to/node, "ne")',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'selected(/simple/xpath/to/node, "four")',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: '/simple/xpath/to/node',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'substr(/simple/xpath/to/node, 5)',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'substr(/simple/xpath/to/node, 2, 4)',
			expected: ['/simple/xpath/to/node'],
		},
		{
			expression: 'sum(/root/item)',
			expected: ['/root/item'],
		},
		{
			expression: 'sin(/numbers/minusone)',
			expected: ['/numbers/minusone'],
		},
		{
			expression: 'sin(/numbers/minuspointfive)',
			expected: ['/numbers/minuspointfive'],
		},
		{
			expression: 'sin(/numbers/zero)',
			expected: ['/numbers/zero'],
		},
		{
			expression: 'sin(/numbers/pointfive)',
			expected: ['/numbers/pointfive'],
		},
		{
			expression: 'sin(/numbers/one)',
			expected: ['/numbers/one'],
		},
		{
			expression: 'sin(/numbers/nan)',
			expected: ['/numbers/nan'],
		},
		{
			expression: 'sin(/numbers/missing)',
			expected: ['/numbers/missing'],
		},
		{
			expression: 'cos(/numbers/minusone)',
			expected: ['/numbers/minusone'],
		},
		{
			expression: 'cos(/numbers/minuspointfive)',
			expected: ['/numbers/minuspointfive'],
		},
		{
			expression: 'cos(/numbers/zero)',
			expected: ['/numbers/zero'],
		},
		{
			expression: 'cos(/numbers/pointfive)',
			expected: ['/numbers/pointfive'],
		},
		{
			expression: 'cos(/numbers/one)',
			expected: ['/numbers/one'],
		},
		{
			expression: 'cos(/numbers/nan)',
			expected: ['/numbers/nan'],
		},
		{
			expression: 'cos(/numbers/missing)',
			expected: ['/numbers/missing'],
		},
		{
			expression: 'tan(/numbers/minuspointfive)',
			expected: ['/numbers/minuspointfive'],
		},
		{
			expression: 'tan(/numbers/zero)',
			expected: ['/numbers/zero'],
		},
		{
			expression: 'tan(/numbers/pointfive)',
			expected: ['/numbers/pointfive'],
		},
		{
			expression: 'tan(/numbers/nan)',
			expected: ['/numbers/nan'],
		},
		{
			expression: 'tan(/numbers/missing)',
			expected: ['/numbers/missing'],
		},
		{
			expression: 'asin(/numbers/minusone)',
			expected: ['/numbers/minusone'],
		},
		{
			expression: 'asin(/numbers/minuspointfive)',
			expected: ['/numbers/minuspointfive'],
		},
		{
			expression: 'asin(/numbers/zero)',
			expected: ['/numbers/zero'],
		},
		{
			expression: 'asin(/numbers/pointfive)',
			expected: ['/numbers/pointfive'],
		},
		{
			expression: 'asin(/numbers/one)',
			expected: ['/numbers/one'],
		},
		{
			expression: 'asin(/numbers/nan)',
			expected: ['/numbers/nan'],
		},
		{
			expression: 'asin(/numbers/missing)',
			expected: ['/numbers/missing'],
		},
		{
			expression: 'acos(/numbers/minusone)',
			expected: ['/numbers/minusone'],
		},
		{
			expression: 'acos(/numbers/minuspointfive)',
			expected: ['/numbers/minuspointfive'],
		},
		{
			expression: 'acos(/numbers/zero)',
			expected: ['/numbers/zero'],
		},
		{
			expression: 'acos(/numbers/pointfive)',
			expected: ['/numbers/pointfive'],
		},
		{
			expression: 'acos(/numbers/one)',
			expected: ['/numbers/one'],
		},
		{
			expression: 'acos(/numbers/nan)',
			expected: ['/numbers/nan'],
		},
		{
			expression: 'acos(/numbers/missing)',
			expected: ['/numbers/missing'],
		},
		{
			expression: 'atan(/numbers/minusone)',
			expected: ['/numbers/minusone'],
		},
		{
			expression: 'atan(/numbers/minuspointfive)',
			expected: ['/numbers/minuspointfive'],
		},
		{
			expression: 'atan(/numbers/zero)',
			expected: ['/numbers/zero'],
		},
		{
			expression: 'atan(/numbers/pointfive)',
			expected: ['/numbers/pointfive'],
		},
		{
			expression: 'atan(/numbers/one)',
			expected: ['/numbers/one'],
		},
		{
			expression: 'atan(/numbers/nan)',
			expected: ['/numbers/nan'],
		},
		{
			expression: 'atan(/numbers/missing)',
			expected: ['/numbers/missing'],
		},
		{
			expression: 'log(/numbers/minusone)',
			expected: ['/numbers/minusone'],
		},
		{
			expression: 'log(/numbers/minuspointfive)',
			expected: ['/numbers/minuspointfive'],
		},
		{
			expression: 'log(/numbers/zero)',
			expected: ['/numbers/zero'],
		},
		{
			expression: 'log(/numbers/pointfive)',
			expected: ['/numbers/pointfive'],
		},
		{
			expression: 'log(/numbers/one)',
			expected: ['/numbers/one'],
		},
		{
			expression: 'log(/numbers/nan)',
			expected: ['/numbers/nan'],
		},
		{
			expression: 'log(/numbers/missing)',
			expected: ['/numbers/missing'],
		},
		{
			expression: 'log10(/numbers/minusone)',
			expected: ['/numbers/minusone'],
		},
		{
			expression: 'log10(/numbers/minuspointfive)',
			expected: ['/numbers/minuspointfive'],
		},
		{
			expression: 'log10(/numbers/zero)',
			expected: ['/numbers/zero'],
		},
		{
			expression: 'log10(/numbers/pointfive)',
			expected: ['/numbers/pointfive'],
		},
		{
			expression: 'log10(/numbers/one)',
			expected: ['/numbers/one'],
		},
		{
			expression: 'log10(/numbers/nan)',
			expected: ['/numbers/nan'],
		},
		{
			expression: 'log10(/numbers/missing)',
			expected: ['/numbers/missing'],
		},
		{
			expression: 'exp(/numbers/minusone)',
			expected: ['/numbers/minusone'],
		},
		{
			expression: 'exp(/numbers/minuspointfive)',
			expected: ['/numbers/minuspointfive'],
		},
		{
			expression: 'exp(/numbers/zero)',
			expected: ['/numbers/zero'],
		},
		{
			expression: 'exp(/numbers/pointfive)',
			expected: ['/numbers/pointfive'],
		},
		{
			expression: 'exp(/numbers/one)',
			expected: ['/numbers/one'],
		},
		{
			expression: 'exp(/numbers/nan)',
			expected: ['/numbers/nan'],
		},
		{
			expression: 'exp(/numbers/missing)',
			expected: ['/numbers/missing'],
		},
		{
			expression: 'exp10(/numbers/minusone)',
			expected: ['/numbers/minusone'],
		},
		{
			expression: 'exp10(/numbers/minuspointfive)',
			expected: ['/numbers/minuspointfive'],
		},
		{
			expression: 'exp10(/numbers/zero)',
			expected: ['/numbers/zero'],
		},
		{
			expression: 'exp10(/numbers/pointfive)',
			expected: ['/numbers/pointfive'],
		},
		{
			expression: 'exp10(/numbers/one)',
			expected: ['/numbers/one'],
		},
		{
			expression: 'exp10(/numbers/nan)',
			expected: ['/numbers/nan'],
		},
		{
			expression: 'exp10(/numbers/missing)',
			expected: ['/numbers/missing'],
		},
		{
			expression: 'sqrt(/numbers/minusone)',
			expected: ['/numbers/minusone'],
		},
		{
			expression: 'sqrt(/numbers/minuspointfive)',
			expected: ['/numbers/minuspointfive'],
		},
		{
			expression: 'sqrt(/numbers/zero)',
			expected: ['/numbers/zero'],
		},
		{
			expression: 'sqrt(/numbers/pointfive)',
			expected: ['/numbers/pointfive'],
		},
		{
			expression: 'sqrt(/numbers/one)',
			expected: ['/numbers/one'],
		},
		{
			expression: 'sqrt(/numbers/nan)',
			expected: ['/numbers/nan'],
		},
		{
			expression: 'sqrt(/numbers/missing)',
			expected: ['/numbers/missing'],
		},
		{
			expression: 'uuid(/numbers/one)',
			expected: ['/numbers/one'],
		},
		{
			expression: 'uuid(/numbers/two)',
			expected: ['/numbers/two'],
		},
		{
			expression: 'uuid(/numbers/six)',
			expected: ['/numbers/six'],
		},
		{
			expression: 'uuid(/numbers/ninetynine)',
			expected: ['/numbers/ninetynine'],
		},
		{
			expression: 'weighted-checklist(5, 5, self::* ,5)',
			expected: ['self::*'],
		},
		{
			expression: 'weighted-checklist(9, 9, /thedata/somenodes/*, /thedata/someweights/*)',
			expected: ['/thedata/somenodes/*', '/thedata/someweights/*'],
		},
		{
			expression: 'weighted-checklist(8, 8, /thedata/somenodes/*, /thedata/someweights/*)',
			expected: ['/thedata/somenodes/*', '/thedata/someweights/*'],
		},
		{
			expression: 'weighted-checklist(10, 10, /thedata/somenodes/*, /thedata/someweights/*)',
			expected: ['/thedata/somenodes/*', '/thedata/someweights/*'],
		},
		{
			expression: '@id="cities"',
			expected: ['@id'],
		},
		{
			expression: '/data/a[selected("a b", "a")]',
			expected: ['/data/a[selected("a b", "a")]'],
		},
		{
			expression: '../name/first = string-length(../name/last)',
			expected: ['../name/first', '../name/last'],
		},
		{
			expression: '@id="3"',
			expected: ['@id'],
		},
		{
			expression: '/data/c[@id="3"] and /data/a[@id="1"]',
			expected: ['/data/c[@id="3"]', '/data/a[@id="1"]'],
		},
		{
			expression: '@id="1"',
			expected: ['@id'],
		},
		{
			expression: '@id="2"',
			expected: ['@id'],
		},
		{
			expression: '@id="4"',
			expected: ['@id'],
		},
		{
			expression: '/data/item/a/number',
			expected: ['/data/item/a/number'],
		},
		{
			expression: '/data/item/a/number/@OpenClinica:this',
			expected: ['/data/item/a/number/@OpenClinica:this'],
		},
		{
			expression: '@OpenClinica:this="three"',
			expected: ['@OpenClinica:this'],
		},
		{
			expression: '../number[@OpenClinica:this="three"]',
			expected: ['../number[@OpenClinica:this="three"]'],
		},
		{
			expression: "@enk:that='something'",
			expected: ['@enk:that'],
		},
		{
			expression: "@id='d'",
			expected: ['@id'],
		},
		{
			expression: "../number[@OpenClinica:this='three']",
			expected: ["../number[@OpenClinica:this='three']"],
		},
		{
			expression: "@OpenClinica:this='three'",
			expected: ['@OpenClinica:this'],
		},
		{
			expression: '@enk:that="something"',
			expected: ['@enk:that'],
		},
		{
			expression: '/data/item/number/@this',
			expected: ['/data/item/number/@this'],
		},
		{
			expression: '@this="four"',
			expected: ['@this'],
		},
		{
			expression: './@this="four"',
			expected: ['./@this'],
		},
		{
			expression: 'string-length(./@this) = 1',
			expected: ['./@this'],
		},
		{
			expression: 'string-length(./@this) < pi()',
			expected: ['./@this'],
		},
		{
			expression: 'string-length(./number)=1',
			expected: ['./number'],
		},
		{
			expression: 'string-length(./number) = 1',
			expected: ['./number'],
		},
		{
			expression: '(./number div 3.14) > 1.9',
			expected: ['./number'],
		},
		{
			expression: 'tan(./number) > 1',
			expected: ['./number'],
		},
		{
			expression: 'tan(./number) <= 1',
			expected: ['./number'],
		},
		{
			expression: '(./number div pi()) >  1.9',
			expected: ['./number'],
		},
		{
			expression: '(./number div pi()) <= 1.9',
			expected: ['./number'],
		},
		{
			expression:
				"if ( /data/consented/deceased_CRVS/info_on_deceased/ageInYears != 'NaN' and string-length( /data/consented/deceased_CRVS/info_on_deceased/ageInYears ) < 0, int( /data/consented/deceased_CRVS/info_on_deceased/ageInYears  * 12 +  /data/consented/deceased_CRVS/info_on_deceased/ageInMonths ), if ( /data/consented/deceased_CRVS/info_on_deceased/age_child_unit  = 'months', /data/consented/deceased_CRVS/info_on_deceased/age_child_months , int( /data/consented/deceased_CRVS/info_on_deceased/age_child_years  * 12)))",
			expected: [
				'/data/consented/deceased_CRVS/info_on_deceased/ageInYears',
				'/data/consented/deceased_CRVS/info_on_deceased/ageInMonths',
				'/data/consented/deceased_CRVS/info_on_deceased/age_child_unit',
				'/data/consented/deceased_CRVS/info_on_deceased/age_child_months',
				'/data/consented/deceased_CRVS/info_on_deceased/age_child_years',
			],
		},
		{
			expression:
				"if ( /data/consented/deceased_CRVS/info_on_deceased/age_child_unit  = 'months', /data/consented/deceased_CRVS/info_on_deceased/age_child_months , int( /data/consented/deceased_CRVS/info_on_deceased/age_child_years  * 12))",
			expected: [
				'/data/consented/deceased_CRVS/info_on_deceased/age_child_unit',
				'/data/consented/deceased_CRVS/info_on_deceased/age_child_months',
				'/data/consented/deceased_CRVS/info_on_deceased/age_child_years',
			],
		},
		{
			expression: 'int( /data/consented/deceased_CRVS/info_on_deceased/age_child_years  * 12)',
			expected: ['/data/consented/deceased_CRVS/info_on_deceased/age_child_years'],
		},
		{
			expression: 'concat("All staff listed:<br>", concat( /data/S5Q1_repeat /S5C1))',
			expected: ['/data/S5Q1_repeat /S5C1'],
		},
		{
			expression: '// form [ @ class ] / @ class',
			expected: ['// form [ @ class ] / @ class'],
			only: true,
		},
		{
			expression: 'div',
			expected: ['div'],
		},
		{
			expression: 'div div div',
			expected: ['div', 'div'],
		},
		{
			expression: 'mod',
			expected: ['mod'],
		},
		{
			expression: 'mod mod mod',
			expected: ['mod', 'mod'],
		},
		{
			expression: 'and',
			expected: ['and'],
		},
		{
			expression: 'and and and',
			expected: ['and', 'and'],
		},
		{
			expression: 'or',
			expected: ['or'],
		},
		{
			expression: 'or or or',
			expected: ['or', 'or'],
		},
		{
			expression: 'id',
			expected: ['id'],
		},
		{
			expression: 'node-test/comment()',
			expected: ['node-test/comment()'],
		},
		{
			expression: 'node-test/ comment ( ) ',
			expected: ['node-test/ comment ( )'],
		},
		{
			expression: 'node-test/node()',
			expected: ['node-test/node()'],
		},
		{
			expression: 'node-test/ node ( ) ',
			expected: ['node-test/ node ( )'],
		},
		{
			expression: 'node-test/processing-instruction()',
			expected: ['node-test/processing-instruction()'],
		},
		{
			expression: 'node-test/ processing-instruction ( ) ',
			expected: ['node-test/ processing-instruction ( )'],
		},
		{
			expression: 'node-test/processing-instruction("pi")',
			expected: ['node-test/processing-instruction("pi")'],
		},
		{
			expression: 'node-test/ processing-instruction ( "pi" ) ',
			expected: ['node-test/ processing-instruction ( "pi" )'],
		},
		{
			expression: 'node-test/text()',
			expected: ['node-test/text()'],
		},
		{
			expression: 'node-test/text ( ) ',
			expected: ['node-test/text ( )'],
		},
		{
			expression: '/ancestor',
			expected: ['/ancestor'],
		},
		{
			expression: '/ancestor-',
			expected: ['/ancestor-'],
		},
		{
			expression: '/ancestor-or',
			expected: ['/ancestor-or'],
		},
		{
			expression: '/ancestor-or-',
			expected: ['/ancestor-or-'],
		},
		{
			expression: '/ancestor-or-self',
			expected: ['/ancestor-or-self'],
		},
		{
			expression: '/ancestor-or-self-',
			expected: ['/ancestor-or-self-'],
		},
		{
			expression: '/ancestor::foo',
			expected: ['/ancestor::foo'],
		},
		{
			expression: '/ancestor::node',
			expected: ['/ancestor::node'],
		},
		{
			expression: 'node-test/comment ()',
			expected: ['node-test/comment ()'],
		},
		{
			expression: 'node-test/comment ( )',
			expected: ['node-test/comment ( )'],
		},
		{
			expression: 'node-test/comment( )',
			expected: ['node-test/comment( )'],
		},
		{
			expression: 'node-test/comment ( ) ',
			expected: ['node-test/comment ( )'],
		},
		{
			expression: '/root/child',
			expected: ['/root/child'],
		},
		{
			expression: "'1' mod/html'",
			expected: ['/html'],
		},
	].forEach(({ expression, expected }) => {
		it(`identifies ${JSON.stringify(
			expression
		)}'s location path/nodeset reference sub-expressions: ${JSON.stringify(
			expected,
			null,
			2
		)}`, () => {
			const parsed = parser.parse(expression);
			const visited = new Set<number>();

			// Workaround: `SyntaxNode.id` was removed from the `web-tree-sitter`
			// types in a recent release. It's unclear if that was a mistake, but we
			// likely won't maintain these tests or logic that requires this id
			// indefinitely anyway.
			const getNodeId = (node: Parser.SyntaxNode): number => {
				return node.walk().nodeId;
			};

			const allCaptures = pathExpressionsQuery.captures(parsed.rootNode);
			const captures = allCaptures.filter((capture) => {
				const { node } = capture;
				const id = getNodeId(node);

				if (visited.has(id)) {
					return false;
				}

				visited.add(id);

				const potentiallyVisited = typedAncestors(
					new Set(['absolute_location_path', 'relative_location_path', 'filter_path_expr']),
					node.parent!
				);

				if (potentiallyVisited.some((ancestor) => visited.has(getNodeId(ancestor)))) {
					return false;
				}

				return true;
			});
			const actual: readonly string[] = captures.map(({ node }) => node.text);

			expect(new Set(actual)).toEqual(new Set(expected));
		});
	});
});
