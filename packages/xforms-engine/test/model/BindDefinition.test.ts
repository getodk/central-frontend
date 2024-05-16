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
import { XFormDefinition } from '../../src/XFormDefinition.ts';

describe('BindDefinition', () => {
	it.each([
		{ dataType: 'string', expected: 'string' },
		{ dataType: 'int', expected: 'int' },
		{ dataType: 'boolean', expected: 'boolean' },
		{ dataType: 'someMadeUpType', expected: 'UNSUPPORTED' },
		{ dataType: null, expected: 'string' },
	])('defines the data type $dataType to $expected', ({ dataType, expected }) => {
		let bindElement = bind('/root/first-question');

		if (dataType != null) {
			bindElement = bindElement.type(dataType);
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

		const xformDefinition = new XFormDefinition(xform.asXml());
		const bindDefinition = xformDefinition.model.binds.get('/root/first-question');

		expect(bindDefinition!.dataType).toEqual(expected);
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

		const xformDefinition = new XFormDefinition(xform.asXml());
		const bindDefinition = xformDefinition.model.binds.get('/root/first-question');

		expect(bindDefinition![computation]?.toString() ?? null).toEqual(expression);
	});
});
