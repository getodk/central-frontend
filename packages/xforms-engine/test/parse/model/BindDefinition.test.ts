import { XSD_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import {
	bind,
	body,
	head,
	html,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import type { BindType } from '../../../src/parse/model/BindTypeDefinition.ts';
import { XFormDefinition } from '../../../src/parse/XFormDefinition.ts';
import { XFormDOM } from '../../../src/parse/XFormDOM.ts';

describe('BindDefinition', () => {
	interface BindDataTypeCase {
		readonly namespaces?: Readonly<Record<string, string>>;
		readonly dataType: string | null;
		readonly expected: BindType;
	}

	it.each<BindDataTypeCase>([
		{ dataType: 'string', expected: 'string' },
		{ dataType: 'int', expected: 'int' },
		{ dataType: 'boolean', expected: 'boolean' },
		{ dataType: 'someMadeUpType', expected: 'string' },
		{ dataType: null, expected: 'string' },

		// Explicit declaration of XML Schema namespace (as implicit default: `xsd`)
		{
			namespaces: {
				xsd: XSD_NAMESPACE_URI,
			},
			dataType: 'xsd:date',
			expected: 'date',
		},

		// Implicit default XML Schema namespace (`xsd`)
		{ dataType: 'xsd:boolean', expected: 'boolean' },

		// Namespaced bind types are not whitespace sensitive. This is consistent
		// with XPath parsing generally! Unclear if we should be similarly lax about
		// whitespace for bare bind types...
		{ dataType: ' xsd :\tdecimal\r\n', expected: 'decimal' },

		// Explicit declaration of non-default XML Schema namespace
		{
			namespaces: {
				'custom-xml-schema-prefix': XSD_NAMESPACE_URI,
			},
			dataType: 'custom-xml-schema-prefix:int',
			expected: 'int',
		},

		// Non-default namespace does not resolve unless declared
		{
			dataType: 'custom-xml-schema-prefix:int',
			expected: 'string',
		},

		// Presumed-default XML Schema namespace bound to another namespace URI
		// is not treated as a default!
		{
			namespaces: {
				xsd: 'https://example.com',
			},
			dataType: 'xsd:binary',
			expected: 'string',
		},
	])('defines the data type $dataType to $expected', ({ dataType, namespaces = {}, expected }) => {
		let bindElement = bind('/root/first-question');

		if (dataType != null) {
			bindElement = bindElement.type(dataType);
		}

		const namespaceDeclarations = Object.entries(namespaces).map(([prefix, namespaceURI]) => {
			return [`xmlns:${prefix}`, namespaceURI] as const;
		});

		const xform = html(
			namespaceDeclarations,
			head(
				title('Bind types'),
				model(
					mainInstance(
						t(
							'root id="bind-types"',
							t('first-question'),
							t('second-question'),
							t('third-question')
						)
					),
					bindElement,
					bind('/root/second-question'),
					bind('/root/third-question')
				)
			),
			body()
		);

		const xformDOM = XFormDOM.from(xform.asXml());
		const xformDefinition = new XFormDefinition(xformDOM);
		const bindDefinition = xformDefinition.model.binds.get('/root/first-question');

		expect(bindDefinition!.type.resolved).toBe(expected);
	});

	it.each([
		{ computation: 'calculate', expression: '/root/second-question * 2' },
		{ computation: 'calculate', expression: null },
		{ computation: 'constraint', expression: '. != 10' },
		{ computation: 'readonly', expression: 'true()' },
		{ computation: 'relevant', expression: "/root/third-question = ''" },
		{ computation: 'required', expression: 'false()' },
		// Not part of DSL...
		// {
		// 	computation: 'saveIncomplete',
		// 	expression: "coalesce(/root/second-question, /root/third-question) != ''",
		// },
	] as const)("defines a bind's $computation as $expression", ({ computation, expression }) => {
		const bindElement = bind('/root/first-question');

		if (expression != null) {
			bindElement[computation](expression);
		}

		const xform = html(
			head(
				title('Bind types'),
				model(
					mainInstance(
						t(
							'root id="bind-types"',
							t('first-question'),
							t('second-question'),
							t('third-question')
						)
					),
					bindElement,
					bind('/root/second-question'),
					bind('/root/third-question')
				)
			),
			body()
		);

		const xformDOM = XFormDOM.from(xform.asXml());
		const xformDefinition = new XFormDefinition(xformDOM);
		const bindDefinition = xformDefinition.model.binds.get('/root/first-question');

		expect(bindDefinition![computation]?.toString() ?? null).toEqual(expression);
	});
});
