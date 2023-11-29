import { beforeEach, describe, expect, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('jr:itext(id)', () => {
	let testContext: XFormsTestContext;

	beforeEach(() => {
		testContext = createXFormsTestContext(
			/* xml */ `<?xml version="1.0" encoding="utf-8"?>
				<h:html
					xmlns="http://www.w3.org/2002/xforms"
					xmlns:ev="http://www.w3.org/2001/xml-events"
					xmlns:h="http://www.w3.org/1999/xhtml"
					xmlns:jr="http://openrosa.org/javarosa"
					xmlns:orx="http://openrosa.org/xforms"
					xmlns:xsd="http://www.w3.org/2001/XMLSchema">
					<h:head>
						<h:title>itexts</h:title>
						<model>
							<itext>
								<translation lang="en">
									<text id="one">
										<value>One</value>
									</text>
									<text id="two">
										<value>Two</value>
									</text>
									<text id="three">
										<value>Three</value>
									</text>
								</translation>
								<translation lang="fr">
									<text id="one">
										<value>Un</value>
									</text>
									<text id="two">
										<value>Deux</value>
									</text>
									<text id="three">
										<value>Trois</value>
									</text>
								</translation>
							</itext>
							<instance><root id="itexts" /></instance>
						</model>
					</h:head>
					<h:body>
					</h:body>
				</h:html>`,
			{
				getRootNode: (document) => document.querySelector('instance')!,
			}
		);
	});

	// TODO: There probably should be a more general/thorough test suite around
	// function namespacing, but this was quick and convenient for now.
	describe('jr: namespace', () => {
		it.fails('to call itext(id) without the JavaRosa namespace', () => {
			testContext.evaluate('itext("one")');
		});

		it.fails('to call fn:itext(id)', () => {
			testContext.evaluate('fn:itext("one")');
		});

		it('fails to call jr:itext(id) where the jr: prefix resolves to another namespace URI', () => {
			const nonJavaRosaNamespaceURI = 'https://example.com/not-javarosa';

			let didLookupNonJavaRosaNamespace = false;
			let caught: Error | null = null;

			try {
				testContext.evaluate('jr:itext("one")', null, XPathResult.ANY_TYPE, {
					lookupNamespaceURI(prefix) {
						if (prefix === 'jr') {
							return nonJavaRosaNamespaceURI;
						}

						didLookupNonJavaRosaNamespace = true;

						return null;
					},
				});
			} catch (error) {
				if (error instanceof Error) {
					caught = error;
				}
			}

			expect(caught).toBeInstanceOf(Error);
			expect(caught!.message.includes(nonJavaRosaNamespaceURI)).toBe(true);
			expect(didLookupNonJavaRosaNamespace).toBe(false);
		});
	});

	it.each([
		{ expression: 'jr:itext("one")', language: 'en', expected: 'One' },
		{ expression: 'jr:itext("two")', language: 'en', expected: 'Two' },
		{ expression: 'jr:itext("three")', language: 'en', expected: 'Three' },
		{ expression: 'jr:itext("one")', language: 'fr', expected: 'Un' },
		{ expression: 'jr:itext("two")', language: 'fr', expected: 'Deux' },
		{ expression: 'jr:itext("three")', language: 'fr', expected: 'Trois' },
		{ expression: 'jr:itext("one")', language: null, expected: 'One' },
		{ expression: 'jr:itext("two")', language: null, expected: 'Two' },
		{ expression: 'jr:itext("three")', language: null, expected: 'Three' },
	] as const)(
		'gets itext translation $expected, for expression $expression, in language $language',
		({ expression, language, expected }) => {
			testContext.setLanguage(language);
			testContext.assertStringValue(expression, expected);
		}
	);

	describe('explicit default language', () => {
		beforeEach(() => {
			testContext = createXFormsTestContext(
				/* xml */ `<?xml version="1.0" encoding="utf-8"?>
					<h:html
						xmlns="http://www.w3.org/2002/xforms"
						xmlns:ev="http://www.w3.org/2001/xml-events"
						xmlns:h="http://www.w3.org/1999/xhtml"
						xmlns:jr="http://openrosa.org/javarosa"
						xmlns:orx="http://openrosa.org/xforms"
						xmlns:xsd="http://www.w3.org/2001/XMLSchema">
						<h:head>
							<h:title>itexts with default language</h:title>
							<model>
								<itext>
									<translation lang="en">
										<text id="one">
											<value>One</value>
										</text>
										<text id="two">
											<value>Two</value>
										</text>
										<text id="three">
											<value>Three</value>
										</text>
									</translation>
									<translation lang="fr" default="">
										<text id="one">
											<value>Un</value>
										</text>
										<text id="two">
											<value>Deux</value>
										</text>
										<text id="three">
											<value>Trois</value>
										</text>
									</translation>
								</itext>
								<instance><root id="itexts-with-default-language" /></instance>
							</model>
						</h:head>
						<h:body>
						</h:body>
					</h:html>`,
				{
					getRootNode: (document) => document.querySelector('instance')!,
				}
			);
		});

		it.each([
			{ expression: 'jr:itext("one")', language: 'en', expected: 'One' },
			{ expression: 'jr:itext("two")', language: 'en', expected: 'Two' },
			{ expression: 'jr:itext("three")', language: 'en', expected: 'Three' },
			{ expression: 'jr:itext("one")', language: 'fr', expected: 'Un' },
			{ expression: 'jr:itext("two")', language: 'fr', expected: 'Deux' },
			{ expression: 'jr:itext("three")', language: 'fr', expected: 'Trois' },
			{ expression: 'jr:itext("one")', language: null, expected: 'Un' },
			{ expression: 'jr:itext("two")', language: null, expected: 'Deux' },
			{ expression: 'jr:itext("three")', language: null, expected: 'Trois' },
		] as const)(
			'gets itext translation $expected, for expression $expression, in language $language',
			({ expression, language, expected }) => {
				testContext.setLanguage(language);
				testContext.assertStringValue(expression, expected);
			}
		);
	});

	describe('fallback to default language', () => {
		beforeEach(() => {
			testContext = createXFormsTestContext(
				/* xml */ `<?xml version="1.0" encoding="utf-8"?>
					<h:html
						xmlns="http://www.w3.org/2002/xforms"
						xmlns:ev="http://www.w3.org/2001/xml-events"
						xmlns:h="http://www.w3.org/1999/xhtml"
						xmlns:jr="http://openrosa.org/javarosa"
						xmlns:orx="http://openrosa.org/xforms"
						xmlns:xsd="http://www.w3.org/2001/XMLSchema">
						<h:head>
							<h:title>itexts with default language</h:title>
							<model>
								<itext>
									<translation lang="en">
										<text id="one">
											<value>One</value>
										</text>
										<text id="two">
											<value>Two</value>
										</text>
										<text id="three">
											<value>Three</value>
										</text>
									</translation>
									<translation lang="fr" default="">
										<text id="one">
											<value>Un</value>
										</text>
										<text id="two">
											<value>Deux</value>
										</text>
										<text id="three">
											<value form="short">Ignored</value>
											<value form="guidance">Ignored for now too</value>
											<value>Trois</value>
										</text>
									</translation>
								</itext>
								<instance><root id="itexts-with-default-language" /></instance>
							</model>
						</h:head>
						<h:body>
						</h:body>
					</h:html>`,
				{
					getRootNode: (document) => document.querySelector('instance')!,
				}
			);
		});

		it.each([
			{ expression: 'jr:itext("one")', language: 'en', expected: 'One' },
			{ expression: 'jr:itext("two")', language: 'en', expected: 'Two' },
			{ expression: 'jr:itext("three")', language: 'en', expected: 'Three' },
			{ expression: 'jr:itext("one")', language: 'fr', expected: 'Un' },
			{ expression: 'jr:itext("two")', language: 'fr', expected: 'Deux' },
			{ expression: 'jr:itext("three")', language: 'fr', expected: 'Trois' },
			{ expression: 'jr:itext("one")', language: null, expected: 'Un' },
			{ expression: 'jr:itext("two")', language: null, expected: 'Deux' },
			{ expression: 'jr:itext("three")', language: null, expected: 'Trois' },
		] as const)(
			'gets itext translation $expected, for expression $expression, in language $language',
			({ expression, language, expected }) => {
				testContext.setLanguage(language);
				testContext.assertStringValue(expression, expected);
			}
		);
	});

	// ODK XForms spec:
	//
	// > In general, all text ids must be replicated across all languages. It is
	// > sometimes only a parser warning if you do not, but it will likely lead to
	// > headaches.
	//
	// TODO: This makes sense from a documentation perspective, but it's unclear
	// what we should actually do here. Probably consult JavaRosa.
	describe.todo('missing translation texts');
});
