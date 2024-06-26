import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

describe('predicates with function calls', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTestContext();
	});

	it('should handle deep example 1', () => {
		// given
		testContext = createTestContext(`
      <model>
        <instance>
          <data>
            <PROCEDURE>
              <PROC_GRID>
                <PROC>6</PROC>
              </PROC_GRID>
            </PROCEDURE>
          </data>
        </instance>
      </model>
    `);

		// expect
		testContext.assertBooleanValue(
			' /model/instance[1]/data/PROCEDURE/PROC_GRID[position() = 1]/PROC = 6 or /model/instance[1]/data/PROCEDURE/PROC_GRID[position() = 2]/PROC = 6',
			true
		);
		testContext.assertStringValue(
			' /model/instance[1]/data/PROCEDURE/PROC_GRID[position() = 1]/PROC = 6 or /model/instance[1]/data/PROCEDURE/PROC_GRID[position() = 2]/PROC = 6',
			'true'
		);
	});

	it('should handle deep example 2', () => {
		// given
		testContext = createTestContext(`
      <model>
        <instance>
           <new_cascading_selections_inside_repeats id="cascading_select_inside_repeats">
             <group1>
                <country/>
                <city/>
                <neighborhood/>
             </group1>
             <meta>
                <instanceID/>
             </meta>
           </new_cascading_selections_inside_repeats>
        </instance>
        <instance id="cities">
           <root>
             <item>
                <itextId>static_instance-cities-0</itextId>
                <country>nl</country>
                <name>ams</name>
             </item>
             <item>
                <itextId>static_instance-cities-1</itextId>
                <country>usa</country>
                <name>den</name>
             </item>
             <item>
                <itextId>static_instance-cities-2</itextId>
                <country>usa</country>
                <name>nyc</name>
             </item>
           </root>
        </instance>
      </model>
    `);

		// expect
		testContext.assertBooleanValue(
			'/model/instance[@id="cities"]/root/item[country=/model/instance[1]/new_cascading_selections/group4/country4 and name=/model/instance[1]/new_cascading_selections/group4/city4]',
			false
		);
		testContext.assertStringValue(
			'/model/instance[@id="cities"]/root/item[country=/model/instance[1]/new_cascading_selections/group4/country4 and name=/model/instance[1]/new_cascading_selections/group4/city4]',
			''
		);
	});

	describe('little predicates', () => {
		[
			{ expression: '//*[@id="3"] and /data/*[@id="1"]', expected: false },
			{ expression: '/data/*[@id="3"] and /data/*[@id="1"]', expected: false },
			{ expression: '/data/c[@id="3"] and /data/a[@id="1"]', expected: false },
			{ expression: '/data/*[@id="1"] and //*[@id="3"]', expected: false },
			{ expression: '/data/*[@id="3"] or /data/*[@id="2"]', expected: true },
			{ expression: '/data/*[@id="1"] and //*[@id="2"]', expected: true },
			{ expression: '/data/*[@id="3"] or /data/*[@id="4"]', expected: false },
		].forEach(({ expression, expected }) => {
			it(`should evaluate ${expression} as ${expected}`, () => {
				testContext = createTestContext(`
          <data>
            <a id="1">aa</a>
            <b id="2">bb</b>
          </data>
        `);

				testContext.assertBooleanValue(expression, expected);
			});
		});
	});

	describe('fiendishly complicated examples #2', () => {
		const namespaces: Record<string, string> = {
			OpenClinica: 'http://openclinica.com/odm',
			enk: 'http://enketo.org/xforms',
		};

		const namespaceResolver = {
			lookupNamespaceURI: (prefix: string | null) => {
				return namespaces[prefix ?? ''] ?? null;
			},
		};

		[
			{ expression: `/*[1]/item/a/number`, expected: 'siete' },
			{ expression: `/data/item/a/number`, expected: 'siete' },
			{ expression: `/data/item/a/number/@OpenClinica:this`, expected: 'seven' },
			{ expression: `/data/item/a/number[@OpenClinica:this="three"]`, expected: 'tres' },
			{
				expression: `normalize-space(/data/item/a[../number[@OpenClinica:this="three"]])`,
				expected: 'cc dd ee',
			},
			{
				expression: `/data/item/a[../number[@OpenClinica:this="three"]]/name[@enk:that='something']/last[@id='d']/@Value`,
				expected: 'ddd',
			},
		].forEach(({ expression, expected }) => {
			it(`should evaluate ${expression} as ${expected}`, () => {
				testContext = createTestContext(
					`
          <data xmlns:OpenClinica="http://openclinica.com/odm" xmlns:enk="http://enketo.org/xforms">
            <item>
              <a>
                <number OpenClinica:this="seven">siete</number>
                <name>
                  <last>aa</last>
                </name>
              </a>
            </item>
            <item>
              <a>
                <number OpenClinica:this="three">tres</number>
                <number OpenClinica:this="four"/>
                <name enk:that="something else">
                  <last>bb</last>
                </name>
              </a>
            </item>
            <item>
              <number OpenClinica:this="three"/>
              <a>
                <name enk:that="something">
                  <last id="c" Value="ccc">cc</last>
                  <last id="d" Value="ddd">dd</last>
                  <last id="e" Value="eee">ee</last>
                </name>
              </a>
            </item>
            <meta>
              <instanceID>a</instanceID>
            </meta>
          </data>
        `,
					{ namespaceResolver }
				);

				testContext.assertStringValue(expression, expected);
			});
		});
	});

	describe('nested predicates', () => {
		[
			{ expression: '/data/item/number/@this', expected: 'seven' },
			{ expression: '/data/item/number[@this]', expected: 'siete' },
			{ expression: '/data/item/number[@this="four"]', expected: 'cuatro' },
			{ expression: '/data/item/name[../number[@this="four"]]/last', expected: 'bb' },
			{ expression: '/data/item/name[../number[./@this="four"]]/last', expected: 'bb' },
			{ expression: '/data/item/name[../number[string-length(./@this) = 1]]/last', expected: 'cc' },
		].forEach(({ expression, expected }) => {
			it(`should evaluate ${expression} as ${expected}`, () => {
				testContext = createTestContext(`
          <data>
            <item>
              <number>entruchón</number>
              <name>decoy</name>
            </item>
            <item>
              <number this="seven">siete</number>
              <name>
                <last>aa</last>
              </name>
            </item>
            <item>
              <number this="three">tres</number>
              <number this="four">cuatro</number>
              <name>
                <last>bb</last>
              </name>
            </item>
            <item>
              <number this="o">la letra o</number>
              <name>
                <last>cc</last>
              </name>
            </item>
          </data>
        `);

				testContext.assertStringValue(expression, expected);
			});
		});
	});

	describe('with native functions', () => {
		[
			{ expression: 'count(/data/item[true()]) = 2', expected: true },
			{ expression: 'count(/data/b[round(2.44) = 2])', expected: 2 },
			{ expression: '/data/item[true()]/number', expected: 4 },
			{ expression: '/data/item[2]/number', expected: 6 },
			{ expression: '/data/item[true()]/number + 1', expected: 5 },
			{ expression: '/data/item[true()]/number + 1', expected: '5' },
			{ expression: '/data/item[string-length("a") = 1]/number + 2', expected: 6 },
			{ expression: '/data/item[string-length("]") = 1]/number + 2', expected: 6 },
			{ expression: `/data/item[string-length(']') = 1]/number + 2`, expected: 6 },
			{ expression: '/data/item[2]/number + 3', expected: 9 },
			{ expression: '/data/item[string-length(./number)=1]/number + 3', expected: 7 },
			{ expression: '/data/item[string-length(./number) = 1]/number + 3', expected: 7 },
			{ expression: '/data/item[(./number div 3.14) > 1.9]/number', expected: 6 },
			{ expression: '/data/item[true()]/number', expected: 4 },
		].forEach(({ expression, expected }) => {
			it(`should evaluate ${expression} as expected`, () => {
				testContext = createTestContext(`
          <data>
            <item>
              <number>4</number>
            </item>
            <item>
              <number>6</number>
            </item>
            <b/>
            <b/>
          </data>
        `);

				switch (typeof expected) {
					case 'boolean':
						testContext.assertBooleanValue(expression, expected);
						break;

					case 'number':
						testContext.assertNumberValue(expression, expected);
						break;

					case 'string':
						testContext.assertStringValue(expression, expected);
						break;

					default:
						throw new UnreachableError(expected);
				}
			});
		});
	});

	describe('(formerly: with extended functions)', () => {
		[{ expression: '/data/item[1]/number', expected: 4 }].forEach(({ expression, expected }) => {
			it(`should evaluate ${expression} as expected`, () => {
				testContext = createTestContext(`
          <data>
            <item>
              <number>4</number>
            </item>
            <item>
              <number>6</number>
            </item>
          </data>
        `);

				testContext.assertNumberValue(expression, expected);
			});
		});
	});

	it('should deal with a fiendishly complicated example', () => {
		testContext = createTestContext(`
        <data>
          <item>
              <number>2</number>
              <name>
                  <first>1</first>
                  <last>bb</last>
              </name>
              <result>incorrect</result>
          </item>
          <item>
              <number>3</number>
              <name>
                  <first>1</first>
                  <last>b</last>
              </name>
              <result>correct</result>
          </item>
      </data>`);

		testContext.assertStringValue(
			'/data/item/number[../name/first = string-length(../name/last)]/../result',
			'correct'
		);
	});
});
