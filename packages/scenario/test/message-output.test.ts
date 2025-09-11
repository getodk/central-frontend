import {
	bind,
	body,
	head,
	html,
	input,
	label,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import type { LeafNodeValidationState } from '@getodk/xforms-engine';
import { describe, expect, it } from 'vitest';
import { AnswerResult, Scenario } from '../src/jr/Scenario.ts';
import { ANSWER_REQUIRED_BUT_EMPTY } from '../src/jr/validation/ValidateOutcome.ts';

describe('Translation text can contain `<output>`', () => {
	it.each(['relative', 'absolute'])('resolves $0 references', async (ref) => {
		const path = ref === 'relative' ? '../name' : '/data/name';
		const scenario = await Scenario.init(
			'translation text with <output> with absolute ref',
			html(
				head(
					title('output with absolute ref'),
					model(
						t(
							'itext',
							t(
								'translation lang="default"',
								t('text id="/data/name:label"', t('value', 'Name')),
								t(
									'text id="/data/value:jr:constraintMsg"',
									t('value', `Hey, <output value=" ${path} " />, that value is too small!`)
								),
								t(
									'text id="/data/date:jr:requiredMsg"',
									t('value', `Dear <output value=" ${path} " />, please fill me in`)
								)
							),
							t(
								'translation lang="fr"',
								t('text id="/data/name:label"', t('value', 'Nom')),
								t(
									'text id="/data/value:jr:constraintMsg"',
									t('value', `Hé, <output value=" ${path} " />, cette valeur est trop petite!`)
								),
								t(
									'text id="/data/date:jr:requiredMsg"',
									t('value', `Cher <output value=" ${path} " />, s'il te plaît, renseigne-moi`)
								)
							)
						),
						mainInstance(t('data id="ref_in_message"', t('name'), t('value'), t('date'))),
						bind('/data/name').type('string'),
						bind('/data/value')
							.type('int')
							.constraint('. &gt; 5')
							.withAttribute(
								'jr',
								'constraintMsg',
								`jr:itext(concat('/data/value:jr:', 'constraintMsg'))`
							),
						bind('/data/date')
							.type('date')
							.required()
							.withAttribute('jr', 'requiredMsg', `jr:itext('/data/date:jr:requiredMsg')`)
					)
				),
				body(
					input('/data/name', t(`label ref="jr:itext('/data/name:label')"`)),
					input('/data/value', label('Value')),
					input('/data/date', label('Date'))
				)
			)
		);

		let result;
		let validate;

		scenario.next('/data/name');
		scenario.answer('Alice');
		scenario.next('/data/value');

		result = scenario.answer('1');
		expect(result).toHaveConstraintMessage('Hey, Alice, that value is too small!');

		result = scenario.answer('6');
		expect(result).toHaveValidityStatus(AnswerResult.OK);

		validate = scenario.getValidationOutcome();
		expect(validate.failedPrompt?.node?.currentState.reference).toBe('/data/date');
		expect(
			(validate.failedPrompt?.node?.validationState as LeafNodeValidationState).required.message
				?.asString
		).toBe('Dear Alice, please fill me in');
		expect(validate.outcome).toBe(ANSWER_REQUIRED_BUT_EMPTY);

		scenario.setLanguage('fr');

		result = scenario.answer('2');
		expect(result).toHaveConstraintMessage('Hé, Alice, cette valeur est trop petite!');

		result = scenario.answer('6');
		expect(result).toHaveValidityStatus(AnswerResult.OK);

		validate = scenario.getValidationOutcome();
		expect(validate.failedPrompt?.node?.currentState.reference).toBe('/data/date');
		expect(
			(validate.failedPrompt?.node?.validationState as LeafNodeValidationState).required.message
				?.asString
		).toBe(`Cher Alice, s'il te plaît, renseigne-moi`);
		expect(validate.outcome).toBe(ANSWER_REQUIRED_BUT_EMPTY);
	});
});
