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
import { type ResolvedFormInstanceInputType } from '@getodk/xforms-engine';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';

import { constants, type InstanceData } from '@getodk/xforms-engine';
import { stringAnswer } from '../src/answer/ExpectedStringAnswer.ts';

const { INSTANCE_FILE_NAME, INSTANCE_FILE_TYPE } = constants;

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
		const instanceFile = new File([instanceXML], INSTANCE_FILE_NAME, {
			type: INSTANCE_FILE_TYPE,
		});
		const instanceData = new FormData();
		instanceData.set(INSTANCE_FILE_NAME, instanceFile);
		const instance = {
			inputType: 'FORM_INSTANCE_INPUT_RESOLVED' as ResolvedFormInstanceInputType,
			data: [instanceData as InstanceData] as const,
		};

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
				editInstance: instance,
			}
		);

		expect(scenario.answerOf('/data/element')).toEqualAnswer(stringAnswer('editing value'));
	});

	it('bind calculation', async () => {
		const instanceXML = `<data id="value-evaluation-order">
	<element>editing value</element>
</data>`;
		const instanceFile = new File([instanceXML], INSTANCE_FILE_NAME, {
			type: INSTANCE_FILE_TYPE,
		});
		const instanceData = new FormData();
		instanceData.set(INSTANCE_FILE_NAME, instanceFile);
		const instance = {
			inputType: 'FORM_INSTANCE_INPUT_RESOLVED' as ResolvedFormInstanceInputType,
			data: [instanceData as InstanceData] as const,
		};

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
				editInstance: instance,
			}
		);

		expect(scenario.answerOf('/data/element')).toEqualAnswer(stringAnswer('bind value'));
	});

	it('setvalue calculation', async () => {
		const instanceXML = `<data id="value-evaluation-order">
	<element>editing value</element>
</data>`;
		const instanceFile = new File([instanceXML], INSTANCE_FILE_NAME, {
			type: INSTANCE_FILE_TYPE,
		});
		const instanceData = new FormData();
		instanceData.set(INSTANCE_FILE_NAME, instanceFile);
		const instance = {
			inputType: 'FORM_INSTANCE_INPUT_RESOLVED' as ResolvedFormInstanceInputType,
			data: [instanceData as InstanceData] as const,
		};

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
				editInstance: instance,
			}
		);

		expect(scenario.answerOf('/data/element')).toEqualAnswer(stringAnswer('setvalue value'));
	});
});
