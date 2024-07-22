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
import type { ExpectStatic } from 'vitest';
import { describe, expect, it } from 'vitest';
import { intAnswer } from '../src/answer/ExpectedIntAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';

describe('TriggerableDagTest.java', () => {
	// order_of_the_DAG_is_ensured
	it('recomputes `calculate` expressions when their dependencies are updated', async () => {
		const scenario = await Scenario.init(
			'Some form',
			html(
				head(
					title('Some form'),
					model(
						mainInstance(t('data id="some-form"', t('a', '2'), t('b'), t('c'))),
						bind('/data/a').type('int'),
						bind('/data/b').type('int').calculate('/data/a * 3'),
						bind('/data/c').type('int').calculate('(/data/a + /data/b) * 5')
					)
				),
				body(input('/data/a'))
			)
		);

		expect(scenario.answerOf('/data/a')).toEqualAnswer(intAnswer(2));
		expect(scenario.answerOf('/data/b')).toEqualAnswer(intAnswer(6));
		expect(scenario.answerOf('/data/c')).toEqualAnswer(intAnswer(40));

		scenario.answer('/data/a', 3);

		expect(scenario.answerOf('/data/a')).toEqualAnswer(intAnswer(3));
		expect(scenario.answerOf('/data/b')).toEqualAnswer(intAnswer(9));
		// Verify that c gets computed using the updated value of b.
		expect(scenario.answerOf('/data/c')).toEqualAnswer(intAnswer(60));
	});
});

describe('MultiplePredicateTest.java', () => {
	describe('[calculate] calculates', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * Typical `nullValue()` -> blank/empty string value check.
		 */
		it('support[s] multiple predicates in one part of [the expression] path', async () => {
			const scenario = await Scenario.init(
				'Some form',
				html(
					head(
						title('Some form'),
						model(
							mainInstance(t('data id="some-form"', t('calc'), t('input'))),
							instance(
								'instance',
								t('item', t('value', 'A'), t('count', '2'), t('id', 'A2')),
								t('item', t('value', 'A'), t('count', '3'), t('id', 'A3')),
								t('item', t('value', 'B'), t('count', '2'), t('id', 'B2'))
							),
							bind('/data/calc')
								.type('string')
								.calculate("instance('instance')/root/item[value = 'A'][count = /data/input]/id"),
							bind('/data/input').type('string')
						)
					),
					body(input('/data/input'))
				)
			);

			scenario.answer('/data/input', '3');

			expect(scenario.answerOf('/data/calc').getValue()).toBe('A3');

			scenario.answer('/data/input', '2');

			expect(scenario.answerOf('/data/calc').getValue()).toBe('A2');

			scenario.answer('/data/input', '7');

			// assertThat(scenario.answerOf("/data/calc"), nullValue());
			expect(scenario.answerOf('/data/calc').getValue()).toBe('');
		});

		/**
		 * **PORTING NOTES**
		 *
		 * - JavaRosa's use of `getValue` with a numeric assertion would require
		 *   additional casting. Ported to use {@link ExpectStatic.toEqualAnswer}
		 *   for similar semantics.
		 *
		 * - Following note is no longer applicable, but it is preserved (struck),
		 *   to provide context for the next point which remains pertinent.
		 *
		 * - ~~Even when adjusting the `calculate` expression to escape `<`, this
		 *   test will fail parsing the `calculate` expression itself. Evidently
		 *   this is due to the unqualified name test `child`.~~
		 *
		 * - Note, in the above point, that the XPath syntax is referenced as
		 *   "abbreviated child-axis steps". This is another current discrepancy in
		 *   the `tree-sitter-xpath` grammar, albeit one without such form-breaking
		 *   impact (which is why it hasn't been filed yet). Despite previous
		 *   misreadings of the XPath grammar spec, `/@foo` and `/foo` are both
		 *   considered steps with an `AbbreviatedAxisSpecifier` (whose grammar is
		 *   "@?"). We should probably at least file this as an issue. Even though
		 *   the distinction hasn't produced any meaningful consequences in our
		 *   usage, correcting it would benefit any other potential users of
		 *   `tree-sitter-xpath` once it's published.
		 */
		it('support[s] multiple predicates in multiple parts of [the expression] path', async () => {
			const scenario = await Scenario.init(
				'Some form',
				html(
					head(
						title('Some form'),
						model(
							mainInstance(t('data id="some-form"', t('calc'), t('input'))),
							instance(
								'instance',
								t(
									'item',
									t('name', 'Bob Smith'),
									t('yob', '1966'),
									t('child', t('name', 'Sally Smith'), t('yob', '1988')),
									t('child', t('name', 'Kwame Smith'), t('yob', '1990'))
								),
								t(
									'item',
									t('name', 'Hu Xao'),
									t('yob', '1972'),
									t('child', t('name', 'Foo Bar'), t('yob', '1988')),
									t('child', t('name', 'Foo2 Bar'), t('yob', '2008'))
								),
								t(
									'item',
									t('name', 'Baz Quux'),
									t('yob', '1968'),
									t('child', t('name', 'Baz2 Quux'), t('yob', '1988')),
									t('child', t('name', 'Baz3 Quux'), t('yob', '1988'))
								)
							),
							bind('/data/calc')
								.type('string')
								.calculate("count(instance('instance')/root/item[yob < 1970]/child[yob = 1988])"),
							bind('/data/input').type('string')
						)
					),
					body(input('/data/input'))
				)
			);

			// assertThat(scenario.answerOf("/data/calc").getValue(), equalTo(3));
			expect(scenario.answerOf('/data/calc')).toEqualAnswer(intAnswer(3));
		});
	});
});
