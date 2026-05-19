import { beforeEach, describe, expect, it } from 'vitest';
import type { XFormsTestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('instance(id)', () => {
	let testContext: XFormsTestContext;

	let instancesByID: Map<string | null, Element>;

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
				<h:title>XForm with secondary instances</h:title>
				<model>
					<instance>
						<root id="xform-with-secondary-instances">
							<one-dot-one>1.1</one-dot-one>
							<one-dot-two>1.2</one-dot-two>
							<two-dot-one>2.1</two-dot-one>
							<two-dot-two>2.2</two-dot-two>

							<one-dot-a>1.a</one-dot-a>
							<one-dot-b>1.b</one-dot-b>
							<two-dot-a>2.a</two-dot-a>
							<two-dot-b>2.b</two-dot-b>
							<meta>
								<instanceID/>
							</meta>
						</root>
					</instance>
					<instance id="secondary-1">
						<root>
							<item>
								<thing-1>1.1</thing-1>
								<thing-2>1.2</thing-2>
							</item>
							<item>
								<thing-1>2.1</thing-1>
								<thing-2>2.2</thing-2>
							</item>
						</root>
					</instance>
					<instance id="secondary-b">
						<root>
							<item>
								<thing-a>1.a</thing-a>
								<thing-b>1.b</thing-b>
							</item>
							<item>
								<thing-a>2.a</thing-a>
								<thing-b>2.b</thing-b>
							</item>
						</root>
					</instance>
				</model>
			</h:head>
			<h:body>
			</h:body>
		</h:html>`,
			{
				getRootNode: (document) => document.querySelector('instance')!,
			}
		);
		const instances = Array.from(testContext.document.querySelectorAll('instance'));

		instancesByID = new Map(instances.map((instance) => [instance.getAttribute('id'), instance]));
	});

	it.each([{ instanceID: 'secondary-1' }, { instanceID: 'secondary-b' }])(
		'gets the instance with the specified id: $instanceID',
		({ instanceID }) => {
			const expression = `instance(${JSON.stringify(instanceID)})`;
			const expected = instancesByID.get(instanceID)!;

			expect(expected).toBeInstanceOf(Element);

			testContext.assertNodeSet(expression, [expected]);
		}
	);

	it.each([
		{ expression: 'instance("secondary-1")/root/item/thing-1', expected: '1.1' },
		{ expression: 'instance("secondary-b")/@id', expected: 'secondary-b' },
		{
			expression: 'instance("secondary-b")/root/item[2]/thing-b',
			expected: '2.b',
		},
	])(
		'evaluates expressions with an instance(id) and additional steps (expression: $expression)',
		({ expression, expected }) => {
			testContext.assertStringValue(expression, expected);
		}
	);

	it.each([
		{ expression: 'instance("secondary-1")/root/item/*[. = /root/one-dot-one]', expected: '1.1' },
		{ expression: 'instance("secondary-1")/root/item/*[. = /root/one-dot-two]', expected: '1.2' },
		{ expression: 'instance("secondary-1")/root/item/*[. = /root/two-dot-one]', expected: '2.1' },
		{ expression: 'instance("secondary-1")/root/item/*[. = /root/two-dot-two]', expected: '2.2' },
		{ expression: 'instance("secondary-b")/root/item/*[. = /root/one-dot-a]', expected: '1.a' },
		{ expression: 'instance("secondary-b")/root/item/*[. = /root/one-dot-b]', expected: '1.b' },
		{ expression: 'instance("secondary-b")/root/item/*[. = /root/two-dot-a]', expected: '2.a' },
		{ expression: 'instance("secondary-b")/root/item/*[. = /root/two-dot-b]', expected: '2.b' },
	])(
		'evaluates $expression (with predicate reference into the primary instance root context) to $expected',
		({ expression, expected }) => {
			testContext.assertStringValue(expression, expected);
		}
	);
});
