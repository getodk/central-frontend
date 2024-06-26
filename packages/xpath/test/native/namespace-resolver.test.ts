import { beforeEach, describe, expect, it } from 'vitest';
import type { TestContext } from '../helpers.ts';
import { createTestContext } from '../helpers.ts';

// Um, this fails in jsdom... but it isn't actually testing evaluator at all???
// This is just DOM behavior! Good to know jsdom fails, but probably doesn't
// belong here.
describe.skip('namespace resolver', () => {
	let testContext: TestContext;
	let document: XMLDocument;

	beforeEach(() => {
		testContext = createTestContext(`
      <!DOCTYPE html>
      <html xml:lang="en-us" xmlns="http://www.w3.org/1999/xhtml" xmlns:ev="http://some-namespace.com/nss">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <title>xpath-test</title>
        </head>
        <body class="yui3-skin-sam" id="body">
          <div id="testXPathNSResolver">
            <div id="testXPathNSResolverNode" xmlns:xforms="http://www.w3.org/2002/xforms">
              <div xmlns="http://www.w3.org/TR/REC-html40">
                <div></div>
              </div>
              <xforms:model>
                <xforms:instance>
                  <ecommerce xmlns="">
                    <method></method>
                    <number></number>
                    <expiry></expiry>
                  </ecommerce>
                </xforms:instance>
                <xforms:submission action="http://example.com/submit" method="post" id="submit" includenamespaceprefixes=""/>
              </xforms:model>
            </div>
          </div>
        </body>
      </html>`);
		document = testContext.document;
	});

	it('looks up the namespaceURIElement', () => {
		const contextNode = document.getElementById('testXPathNSResolverNode')!;

		let resolver = document.createNSResolver(contextNode);

		// check type
		//TODO assert.instanceOf(resolver, XPathNSResolver);
		// eslint-disable-next-line @typescript-eslint/unbound-method
		expect(resolver.lookupNamespaceURI).toBeInstanceOf(Function);

		// check preconfigured namespaces
		expect(resolver.lookupNamespaceURI('xml')).toEqual('http://www.w3.org/XML/1998/namespace');
		//TODO assert.equal(resolver.lookupNamespaceURI('xmlns'), 'http://www.w3.org/2000/xmlns/');

		// check namespaces on current element
		expect(resolver.lookupNamespaceURI('xforms')).toEqual('http://www.w3.org/2002/xforms');
		expect(resolver.lookupNamespaceURI('nsnotexists')).toBeNull();

		// check default namespace
		resolver = document.createNSResolver(contextNode.firstElementChild!);

		expect(resolver.lookupNamespaceURI('')).toEqual('http://www.w3.org/TR/REC-html40');
		//Y.Assert.areSame('http://www.w3.org/TR/REC-html40', resolver.lookupNamespaceURI(''));
	});

	it('looks up the namespaceURIDocument', () => {
		const resolver = document.createNSResolver(document);

		// assert.instanceOf(resolver, XPathNSResolver);
		// eslint-disable-next-line @typescript-eslint/unbound-method
		expect(resolver.lookupNamespaceURI).toBeInstanceOf(Function);
		expect(resolver.lookupNamespaceURI('ev')).toEqual('http://some-namespace.com/nss');
	});

	it('looks up the namespaceURIDocumentElement', () => {
		const contextNode = document.documentElement;
		const resolver = document.createNSResolver(contextNode);

		// assert.instanceOf(resolver, XPathNSResolver);
		// eslint-disable-next-line @typescript-eslint/unbound-method
		expect(resolver.lookupNamespaceURI).toBeInstanceOf(Function);

		expect(resolver.lookupNamespaceURI('ev')).toEqual('http://some-namespace.com/nss');
		expect(resolver.lookupNamespaceURI('')).toEqual('http://www.w3.org/1999/xhtml');

		// TODO: all of these namespace-related mutations probably fail in Firefox!
		// Make sure default xhtml namespace is correct
		contextNode.removeAttribute('xmlns');
		// assert.isNull(resolver.lookupNamespaceURI(''));

		// Change default root namespace
		contextNode.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', 'some-namespace');
		// assert.equal(resolver.lookupNamespaceURI(''), 'some-namespace');

		// Revert back to default xhtml namespace
		contextNode.setAttributeNS(
			'http://www.w3.org/2000/xmlns/',
			'xmlns',
			'http://www.w3.org/1999/xhtml'
		);

		expect(resolver.lookupNamespaceURI('')).toEqual('http://www.w3.org/1999/xhtml');
	});

	it('looks up the namespaceURIAttribute', () => {
		let contextNode: Element = document.documentElement;

		// See below: previously this checked for the first attribute where
		// `specified` is true. According to
		/**
		 * See commented out code below: previously this looked for the first attribute
		 * whose `specified` is true. This will always be true according to
		 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Attr/specified}.
		 */
		let attribute: Attr | null = contextNode.attributes[0] ?? null;
		// // Check parent nodes for namespace prefix declarations
		// for (i = 0; i < node.attributes.length; i++) {
		//   if (node.attributes[ i ].specified) {
		//     attribute = node.attributes[ i ];
		//     break;
		//   }
		// }

		expect(attribute).not.toBeNull();

		let resolver = document.createNSResolver(attribute!);

		expect(resolver.lookupNamespaceURI('ev')).toEqual('http://some-namespace.com/nss');

		// Check parent nodes for default namespace declaration
		contextNode = document.getElementById('testXPathNSResolverNode')!;
		attribute = contextNode.attributes[0] ?? null;

		// for(let i = 0; i < contextNode.attributes.length; i++) {
		//   if(contextNode.attributes[ i ].specified) {
		//     attribute = contextNode.attributes[i];
		//     break;
		//   }
		// }

		expect(attribute).not.toBeNull();
		resolver = document.createNSResolver(attribute!);

		expect(resolver.lookupNamespaceURI('xforms')).toEqual('http://www.w3.org/2002/xforms');
	});

	it('looks up namespaceURIs that have changed', () => {
		const contextNode = document.getElementById('testXPathNSResolverNode')!.firstElementChild!;
		const resolver = document.createNSResolver(contextNode);

		expect(resolver.lookupNamespaceURI('')).toEqual('http://www.w3.org/TR/REC-html40');

		// TODO: all of these namespace-related mutations probably fail in Firefox!
		// Remove default namespace
		contextNode.removeAttribute('xmlns');
		// assert.equal(resolver.lookupNamespaceURI(''), 'http://www.w3.org/1999/xhtml');

		// Change default namespace to some other namespace
		contextNode.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', 'some-namespace');
		// assert.equal(resolver.lookupNamespaceURI(''), 'some-namespace');

		// No default namespace
		contextNode.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', '');
		// assert.equal(resolver.lookupNamespaceURI(''), '');

		// Back to original
		contextNode.setAttributeNS(
			'http://www.w3.org/2000/xmlns/',
			'xmlns',
			'http://www.w3.org/TR/REC-html40'
		);

		expect(resolver.lookupNamespaceURI('')).toEqual('http://www.w3.org/TR/REC-html40');
	});

	it('looks up a hierarchical namespaceURI', () => {
		const contextNode = document.getElementById('testXPathNSResolverNode')!;
		let resolver = document.createNSResolver(contextNode);

		// check prefix in parents
		expect(resolver.lookupNamespaceURI('ev')).toEqual('http://some-namespace.com/nss');

		// check default prefix in parents
		expect(resolver.lookupNamespaceURI('')).toEqual('http://www.w3.org/1999/xhtml');

		resolver = document.createNSResolver(contextNode.firstElementChild!.firstElementChild!);
		expect(resolver.lookupNamespaceURI('')).toEqual('http://www.w3.org/TR/REC-html40');
	});
});
