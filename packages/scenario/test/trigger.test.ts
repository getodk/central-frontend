import {
	body,
	head,
	html,
	label,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { booleanAnswer } from '../src/answer/ExpectedBooleanAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';

describe('<trigger>', () => {
	type TriggerValue = '' | 'OK';

	interface TriggerCase {
		readonly initialFormDefinitionValue: TriggerValue;
		readonly expectedInitialValue: boolean;
		readonly assignState: boolean;
		readonly expectedAssignedValue: boolean;
	}

	it.each<TriggerCase>([
		{
			initialFormDefinitionValue: '',
			expectedInitialValue: false,
			assignState: true,
			expectedAssignedValue: true,
		},
		{
			initialFormDefinitionValue: 'OK',
			expectedInitialValue: true,
			assignState: false,
			expectedAssignedValue: false,
		},
		{
			initialFormDefinitionValue: 'OK',
			expectedInitialValue: true,
			assignState: true,
			expectedAssignedValue: true,
		},
		{
			initialFormDefinitionValue: '',
			expectedInitialValue: false,
			assignState: false,
			expectedAssignedValue: false,
		},
	])(
		'supports ODK XForms trigger semantics (initial state: $initialFormDefinitionValue; expected initial: $expectedInitialValue; assign state: $assignState; expected assigned: $expectedAssignedValue)',
		async ({
			initialFormDefinitionValue,
			expectedInitialValue,
			assignState,
			expectedAssignedValue,
		}) => {
			const scenario = await Scenario.init(
				'Form with trigger',
				// prettier-ignore
				html(
				head(
					title('Form with trigger'),
					model(
						mainInstance(t("data id='multilingual-select'",
							t('maybe-ok', initialFormDefinitionValue))))
				),
				body(
					t('trigger ref="/data/maybe-ok"',
						label('Maybe OK'))
				)
			)
			);

			expect(scenario.answerOf('/data/maybe-ok')).toEqualAnswer(
				booleanAnswer(expectedInitialValue)
			);

			scenario.answer('/data/maybe-ok', assignState);

			expect(scenario.answerOf('/data/maybe-ok')).toEqualAnswer(
				booleanAnswer(expectedAssignedValue)
			);
		}
	);
});
