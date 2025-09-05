import {
	bind,
	body,
	head,
	html,
	input,
	instance,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { stringAnswer } from '../../../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../../../src/jr/Scenario.ts';

describe('ODK function support: `pulldata`', () => {
	describe('valid calculation returns expected values', () => {
		it.each([
			{
				testName: 'returns match when there is one matching result',
				property: '@location',
				inputValue: 'north',
				expectedOutput: 'Alaska',
			},
			{
				testName: 'returns empty string when there are no matching results',
				property: '@location',
				inputValue: 'west',
				expectedOutput: '',
			},
			{
				testName: 'returns first match when there are multiple',
				property: '@location',
				inputValue: 'south',
				expectedOutput: 'Texas',
			},
			{
				testName: 'returns empty string when uses not existing property',
				property: '@doesnotexist',
				inputValue: 'nothing',
				expectedOutput: '',
			},
			{
				testName: 'returns empty string when uses not existing property with no value',
				property: '@doesnotexist',
				inputValue: '',
				expectedOutput: '',
			},
			{
				testName: 'returns first match when there are multiple with relative path',
				property: '@location',
				inputValue: 'south',
				expectedOutput: 'Texas',
				relative: true,
			},
			{
				testName: 'returns value match',
				property: 'value',
				inputValue: 'Texas',
				expectedOutput: 'Texas',
			},
			// @TODO current fails due to https://github.com/getodk/web-forms/issues/492
			// {
			// 	testName: 'returns match when punctuation input',
			// 	property: '@location',
			// 	inputValue: `punctua'tion's`,
			// 	expectedOutput: `Punctuation's`,
			// },
		])('$testName', async ({ property, inputValue, expectedOutput, relative }) => {
			const path = relative ? '../my-location' : '/data/my-location';
			const scenario = await Scenario.init(
				'Some form',
				html(
					head(
						title('pulldata form'),
						model(
							mainInstance(t('data id="pulldata"', t('my-location', inputValue), t('my-state'))),
							instance(
								'states',
								t('item abbreviation="AK" location="north"', t('value', 'Alaska')),
								t('item abbreviation="TX" location="south"', t('value', 'Texas')),
								t('item abbreviation="HI" location="south"', t('value', 'Hawaii')),
								t(`item abbreviation="PU" location="punctua'tion's"`, t('value', `Punctuation's`)),
								t('item abbreviation="WY"', t('value', 'Wyoming'))
							),
							bind('/data/my-state').type('string'),
							bind('/data/my-state')
								.type('string')
								.calculate(`pulldata('states', 'value', '${property}', ${path})`)
						)
					),
					body(input('/data/my-location'))
				)
			);

			expect(scenario.answerOf('/data/my-state')).toEqualAnswer(stringAnswer(expectedOutput));
		});
	});
});
