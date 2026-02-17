import {
	bind,
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	setvalueLiteral,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';

import { stringAnswer } from '../src/answer/ExpectedStringAnswer.ts';

describe('Value evaluation order', () => {
	it('default value', async () => {
		const scenario = await Scenario.init(
			'Value evalatation order',
			html(
				head(
					title('Value evaluation order'),
					model(mainInstance(t('data id="value-evaluation-order"', t('element', 'default'))))
				),
				body(input('/data/element'))
			)
		);

		expect(scenario.answerOf('/data/element')).toEqualAnswer(stringAnswer('default'));
	});

	it('preload', async () => {
		const scenario = await Scenario.init(
			'Value evalatation order',
			html(
				head(
					title('Value evaluation order'),
					model(
						mainInstance(t('data id="value-evaluation-order"', t('element', 'default'))),
						bind('/data/element').preload('uid')
					)
				),
				body(input('/data/element'))
			)
		);

		expect(scenario.answerOf('/data/element')).toStartWith('uuid:');
	});

	it('editing instance', async () => {
		const instanceXML = `<data id="value-evaluation-order">
	<element>editing value</element>
</data>`;
		const scenario = await Scenario.init(
			'Value evalatation order',
			html(
				head(
					title('Value evaluation order'),
					model(
						mainInstance(t('data id="value-evaluation-order"', t('element', 'default'))),
						bind('/data/element').preload('uid')
					)
				),
				body(input('/data/element'))
			),
			{
				editInstance: instanceXML,
			}
		);

		expect(scenario.answerOf('/data/element')).toEqualAnswer(stringAnswer('editing value'));
	});

	it('bind calculation', async () => {
		const instanceXML = `<data id="value-evaluation-order">
	<element>editing value</element>
</data>`;
		const scenario = await Scenario.init(
			'Value evalatation order',
			html(
				head(
					title('Value evaluation order'),
					model(
						mainInstance(t('data id="value-evaluation-order"', t('element', 'default'))),
						bind('/data/element').preload('uid').calculate("'bind value'")
					)
				),
				body(input('/data/element'))
			),
			{
				editInstance: instanceXML,
			}
		);

		expect(scenario.answerOf('/data/element')).toEqualAnswer(stringAnswer('bind value'));
	});

	it('setvalue calculation', async () => {
		const instanceXML = `<data id="value-evaluation-order">
	<element>editing value</element>
</data>`;
		const scenario = await Scenario.init(
			'Value evalatation order',
			html(
				head(
					title('Value evaluation order'),
					model(
						mainInstance(t('data id="value-evaluation-order"', t('element', 'default'))),
						setvalueLiteral('odk-instance-load', '/data/element', 'setvalue value'),
						bind('/data/element').preload('uid').calculate("'bind value'")
					)
				),
				body(input('/data/element'))
			),
			{
				editInstance: instanceXML,
			}
		);

		expect(scenario.answerOf('/data/element')).toEqualAnswer(stringAnswer('setvalue value'));
	});
});
