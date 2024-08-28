import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext, getNonNamespaceAttributes } from '../helpers.ts';

describe('Union operator', () => {
	let testContext: TestContext;
	let document: XMLDocument;

	beforeEach(() => {
		testContext = createTestContext(`
      <div id="UnionOperatorTestCase">
        <div id="eee10">
          <div id="eee20">
            <div>
              <div id="eee25"></div>
            </div>
          </div>
          <div id="eee30">
            <div id="eee35"></div>
            <div id="eee40" class="sss"></div>
          </div>
        </div>
        <div id="eee50"></div>

        <div id="nss10">
          <div id="nss20">
            <div id="nss25" xmlns:asdf="http://asdf.com/" align="right"></div>
            <div xmlns:asdf="http://asdf.com/" id="nss30"></div>
          </div>
          <div id="nss40" xmlns:asdf="sss" xmlns:asdf2="sdfsdf"></div>
        </div>
      </div>`);
		document = testContext.document;
	});

	it('combines two elements', () => {
		testContext.assertNodeSet("id('eee10') | id('eee20')", [
			document.getElementById('eee10')!,
			document.getElementById('eee20')!,
		]);
	});

	describe('without spaces around the operator', () => {
		it('should work with a simple nodeset before the operator', () => {
			testContext.assertNodeSet("/div/div/div/div/div|id('eee20')", [
				// these are in document order, not the order they are listed in the expression // TODO check if this is to spec
				document.getElementById('eee20')!,
				document.getElementById('eee25')!,
			]);
		});

		it('should work with a predicated nodeset before the operator 0', () => {
			testContext.assertNodeSet("/*[1]/*[1]|id('eee20')", [
				document.getElementById('eee10')!,
				document.getElementById('eee20')!,
			]);
		});

		it('should work with a predicated nodeset before the operator 1', () => {
			testContext.assertNodeSet("/div/div[1]|id('eee20')", [
				document.getElementById('eee10')!,
				document.getElementById('eee20')!,
			]);
		});

		it('should work with a predicated nodeset before the operator 2', () => {
			testContext.assertNodeSet("/div[1]/div[1]|id('eee20')", [
				document.getElementById('eee10')!,
				document.getElementById('eee20')!,
			]);
		});

		it('should work with a predicated nodeset before the operator 3', () => {
			testContext.assertNodeSet("/div[1]/div[1]|id('eee20')", [
				document.getElementById('eee10')!,
				document.getElementById('eee20')!,
			]);
		});

		it('should work with a function call before the operator', () => {
			testContext.assertNodeSet("id('eee10')|id('eee20')", [
				document.getElementById('eee10')!,
				document.getElementById('eee20')!,
			]);
		});
	});

	it('combines many elements', () => {
		testContext.assertNodeSet(
			"id('eee40') | id('eee20') | id('eee25') | id('eee10') | id('eee30') | id('eee50')",
			[
				document.getElementById('eee10')!,
				document.getElementById('eee20')!,
				document.getElementById('eee25')!,
				document.getElementById('eee30')!,
				document.getElementById('eee40')!,
				document.getElementById('eee50')!,
			]
		);
	});

	describe('general tests', () => {
		// TODO these were created while debugging UNION, but should be somewhere else
		it('combines elements and attributes', () => {
			testContext.assertNodeSet("id('eee40')/attribute::*[1] | id('eee30')", [
				document.getElementById('eee30')!,
				getNonNamespaceAttributes(document.getElementById('eee40')!)[0]!,
			]);
		});

		it('returns indexed attributes', () => {
			testContext.assertNodeSet("id('eee40')/attribute::*[1]", [
				getNonNamespaceAttributes(document.getElementById('eee40')!)[0]!,
			]);
		});

		it('returns all attributes', () => {
			testContext.assertNodeSet(
				"id('eee40')/attribute::*",
				getNonNamespaceAttributes(document.getElementById('eee40')!)
			);
		});

		it('returns root node', () => {
			testContext.assertNodeSet('/div', [document.getElementById('UnionOperatorTestCase')!]);
		});

		it('returns doc node', () => {
			testContext.assertNodeSet('/', [document]);
		});
	});

	it('combines elements and attributes', () => {
		testContext.assertNodeSet("id('eee40')/attribute::*[1] | id('eee30')", [
			document.getElementById('eee30')!,
			getNonNamespaceAttributes(document.getElementById('eee40')!)[0]!,
		]);
	});

	it('combines elements and attributes if they refer to the same element', () => {
		testContext.assertNodeSet("id('eee40')/attribute::*[1] | id('eee40')", [
			document.getElementById('eee40')!,
			getNonNamespaceAttributes(document.getElementById('eee40')!)[0]!,
		]);
	});

	it('combines elements and attributs if they refer to different trees', () => {
		testContext.assertNodeSet("id('eee40')/attribute::*[1] | id('eee20')", [
			document.getElementById('eee20')!,
			getNonNamespaceAttributes(document.getElementById('eee40')!)[0]!,
		]);
	});

	it('combines elements and attributes if the attribute is on a parent element in the same tree', () => {
		testContext.assertNodeSet("id('eee40') | id('eee30')/attribute::*[1]", [
			getNonNamespaceAttributes(document.getElementById('eee30')!)[0]!,
			document.getElementById('eee40')!,
		]);
	});

	it('combines elements and attributes if both are (on) elements under the same parent', () => {
		testContext.assertNodeSet("id('eee40') | id('eee35')/attribute::*[1]", [
			getNonNamespaceAttributes(document.getElementById('eee35')!)[0]!,
			document.getElementById('eee40')!,
		]);
	});

	it('combines attributes that live on different elements', () => {
		testContext.assertNodeSet("id('eee35')/attribute::*[1] | id('eee40')/attribute::*[1]", [
			getNonNamespaceAttributes(document.getElementById('eee35')!)[0]!,
			getNonNamespaceAttributes(document.getElementById('eee40')!)[0]!,
		]);
	});

	it('combines attributes that live on descendant elements', () => {
		testContext.assertNodeSet("id('eee30')/attribute::*[1] | id('eee40')/attribute::*[1]", [
			getNonNamespaceAttributes(document.getElementById('eee30')!)[0]!,
			getNonNamespaceAttributes(document.getElementById('eee40')!)[0]!,
		]);
	});

	it('combines attributes that live on descendant element (reversed)', () => {
		testContext.assertNodeSet("id('eee40')/attribute::*[1] | id('eee30')/attribute::*[1]", [
			getNonNamespaceAttributes(document.getElementById('eee30')!)[0]!,
			getNonNamespaceAttributes(document.getElementById('eee40')!)[0]!,
		]);
	});

	it('combines different attributes on the same element', () => {
		//TODO Is node order important? chrome vs firefox have different order.
		testContext.assertUnorderedNodeSet(
			"id('eee40')/attribute::*[2] | id('eee40')/attribute::*[1]",
			getNonNamespaceAttributes(document.getElementById('eee40')!)
		); //firefox
		// expected
		// [class="sss", id="eee40"]

		// chrome
		// [class="sss", id="eee40"]

		// firefox -- returns attributes in the order they are found
		// [id="eee40", class="sss"]
	});

	it('combines a namespace and attribute on the same element', () => {
		testContext.assertNodeSet("id('nss25')/namespace::* | id('nss25')/attribute::*", [
			...testContext.document.getElementById('nss25')!.attributes,
		]);
	});

	it('combines two namespaces on the same element', () => {
		const result = testContext.evaluateNodeSet("id('nss40')/namespace::*");

		testContext.assertNodeSet("id('nss40')/namespace::* | id('nss40')/namespace::*", result);
	});

	it('combines a namespace and attribute', () => {
		const result = testContext.evaluateNodeSet("id('nss40')/namespace::*");

		//chrome vs firefox have different order.
		testContext.assertUnorderedNodeSet(
			"id('nss40')/namespace::* | id('nss25')/attribute::* | id('nss25')",
			[
				document.getElementById('nss25')!,
				...getNonNamespaceAttributes(document.getElementById('nss25')!),
				...result,
			]
		);
	});
});
