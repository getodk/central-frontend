import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { beforeEach, describe, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

// Most of the tests originally in this suite are under the native suite with the same module name. Those exercising XForms extension functions have been moved here.
describe('predicates with function calls', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext();
	});

	it('should handle deep example 1', () => {
		// given
		testContext = createXFormsTestContext(`
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
		testContext = createXFormsTestContext(`
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
			{
				expression: `concat( selected( /data/item/a[../number[@OpenClinica:this='three']]/name[@enk:that="something"]/last/@Value, 'ccc' ), 'ing', '-', sin( pi() div 2))`,
				expected: 'trueing-1',
			},
		].forEach(({ expression, expected }) => {
			it(`should evaluate ${expression} as ${expected}`, () => {
				testContext = createXFormsTestContext(
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
			{
				expression: '/data/item/name[../number[string-length(./@this) < pi()]]/last',
				expected: 'cc',
			},
		].forEach(({ expression, expected }) => {
			it(`should evaluate ${expression} as ${expected}`, () => {
				testContext = createXFormsTestContext(`
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

	describe('with extended functions', () => {
		[
			{ expression: 'pi()', expected: 3.141592653589793 },
			{ expression: '/data/item[pi() > 3]/number', expected: 4 },
			{ expression: '/data/item[tan(./number) > 1]/number', expected: 4 },
			{ expression: '/data/item[tan(./number) <= 1]/number', expected: 6 },
			{ expression: '/data/item[(./number div pi()) >  1.9]/number', expected: 6 },
			{ expression: '/data/item[(./number div pi()) <= 1.9]/number', expected: 4 },
		].forEach(({ expression, expected }) => {
			it(`should evaluate ${expression} as expected`, () => {
				testContext = createXFormsTestContext(`
          <data>
            <item>
              <number>4</number>
            </item>
            <item>
              <number>6</number>
            </item>
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

	// I put this one separate as it has a different 'too many args' error, and there may be multiple causes for failure
	it('with the #selected function', () => {
		testContext = createXFormsTestContext(`
      <data>
        <a>a</a>
        <a>b</a>
        <a>c</a>
      </data>
    `);

		// assertTrue('selected("a b", "a")');
		testContext.assertNumberValue('count(/data/a[selected("a b", "a")])', 3);
	});
});
