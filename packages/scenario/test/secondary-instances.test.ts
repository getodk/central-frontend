import {
	bind,
	body,
	group,
	head,
	html,
	input,
	instance,
	item,
	mainInstance,
	model,
	repeat,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';

// Ported as of https://github.com/getodk/javarosa/commit/5ae68946c47419b83e7d28290132d846e457eea6
describe('Secondary instances', () => {
	/**
	 * **PORTING NOTES**
	 *
	 * In a Slack discussion, we decided to skip the first several tests in
	 * `PredicateCachingTest.java` (concerned with measuring the number of
	 * evaluations performed for a given form and/or action within it); we also
	 * decided to port the remaining tests (which exercise correctness concerns),
	 * organized into other modules as appropriate.
	 */
	describe('PredicateCachingTest.java', () => {
		/**
		 * JR:
		 * A form with multiple secondary instances can have expressions with "equivalent" predicates that filter on
		 * different sets of children. It's pretty possible to write a bug where these predicates are treated as the same
		 * thing causing incorrect answers.
		 */
		describe('equivalent predicate expressions on different references', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * 1. Rephrase as "produces distinct results from each secondary instance"?
			 * 2. The test itself could be more clear, presumably by making the
			 *    derived values from each secondary instance distinct.
			 *
			 * The test below is an attempt at that, but notably required a change
			 * to the test fixture. If we go with that, we'll probalby want to revise
			 * the original fixture (and perhaps revise both in JavaRosa).
			 */
			it('[is] are not confused', async () => {
				const scenario = await Scenario.init('two-secondary-instances.xml');

				scenario.next('/data/choice');
				scenario.answer('a');

				expect(scenario.answerOf('/data/both').getValue()).toBe('AA');
			});

			describe('(potentially clearer variation of above test)', () => {
				it('produces distinct results from each secondary instance', async () => {
					const scenario = await Scenario.init('two-secondary-instances-alt.xml');

					scenario.next('/data/choice');
					scenario.answer('c');

					expect(scenario.answerOf('/data/both').getValue()).toBe(
						'C (from instance_one)C (from instance_two)'
					);
				});
			});
		});

		describe('equivalent predicate expressions in repeats', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * 1. Rephrase?
			 * 2. The original JavaRosa test's second assertion checks for the answer
			 *    (`answerOf` return value) to be `equalTo(null)`. It seems likely
			 *    given the form's shape that the intent is to check that the field is
			 *    present and its value is blank, at that point in time.
			 * 3. (HUNCH ONLY!) I'm betting this failure is related to the form's
			 *    `current()` sub-expression (which I doubt is being accounted for in
			 *    dependency analysis, and is therefore failing to establish a
			 *    reactive subscription within the engine).
			 */
			it.fails('[does] do not get confused', async () => {
				const scenario = await Scenario.init('repeat-secondary-instance.xml');

				scenario.createNewRepeat('/data/repeat');
				scenario.createNewRepeat('/data/repeat');

				scenario.answer('/data/repeat[1]/choice', 'a');

				expect(scenario.answerOf('/data/repeat[1]/calculate').getValue()).toBe('A');
				// assertThat(scenario.answerOf('/data/repeat[2]/calculate'), equalTo(null));
				expect(scenario.answerOf('/data/repeat[1]/calculate').getValue()).toBe('');

				scenario.answer('/data/repeat[2]/choice', 'b');

				expect(scenario.answerOf('/data/repeat[1]/calculate').getValue()).toBe('A');
				expect(scenario.answerOf('/data/repeat[2]/calculate').getValue()).toBe('B');
			});
		});

		describe('predicates on different child names', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Rephrase?
			 */
			it('[does] do not get confused', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(t('data id="some-form"', t('cat'), t('dog'), t('input'))),
								instance(
									'instance',
									t('cat', t('name', 'Vinnie'), t('age', '12')),
									t('dog', t('name', 'Vinnie'), t('age', '9'))
								),
								bind('/data/cat')
									.type('string')
									.calculate("instance('instance')/root/cat[name = /data/input]/age"),
								bind('/data/dog')
									.type('string')
									.calculate("instance('instance')/root/dog[name = /data/input]/age"),
								bind('/data/input').type('string')
							)
						),
						body(input('/data/input'))
					)
				);

				scenario.answer('/data/input', 'Vinnie');

				expect(scenario.answerOf('/data/cat').getValue()).toBe('12');
				expect(scenario.answerOf('/data/dog').getValue()).toBe('9');
			});
		});

		describe('eq expressions', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Rephrase?
			 */
			it('work[s] if either side is relative', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(t('data id="some-form"', t('calcltr'), t('calcrtl'), t('input'))),
								instance('instance', t('item', t('value', 'A')), t('item', t('value', 'B'))),
								bind('/data/calcltr')
									.type('string')
									.calculate("instance('instance')/root/item[value = /data/input]/value"),
								bind('/data/calcrtl')
									.type('string')
									.calculate("instance('instance')/root/item[/data/input = value]/value"),
								bind('/data/input').type('string')
							)
						),
						body(input('/data/input'))
					)
				);

				scenario.answer('/data/input', 'A');

				expect(scenario.answerOf('/data/calcltr').getValue()).toBe('A');
				expect(scenario.answerOf('/data/calcrtl').getValue()).toBe('A');

				scenario.answer('/data/input', 'B');

				expect(scenario.answerOf('/data/calcltr').getValue()).toBe('B');
				expect(scenario.answerOf('/data/calcrtl').getValue()).toBe('B');
			});

			/**
			 * **PORTING NOTES**
			 *
			 * Rephrase?
			 */
			it('work[s] if both sides are relative', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(t('data id="some-form"', t('calc'), t('input'))),
								instance('instance', t('item', t('value', 'A'))),
								bind('/data/calc')
									.type('string')
									.calculate("instance('instance')/root/item[value = value]/value"),
								bind('/data/input').type('string')
							)
						),
						body(input('/data/input'))
					)
				);

				expect(scenario.answerOf('/data/calc').getValue()).toBe('A');
			});
		});

		describe('nested predicates', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * 1. Rephrase?
			 * 2. Treats null check as blank/empty string check, as with "equivalent
			 *    predicate expressions in repeats" block.
			 */
			it('[does] do not get confused', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(
									t('data id="some-form"', t('calc'), t('calc2'), t('input1'), t('input2'))
								),
								instance(
									'instance',
									t('item', t('value', 'A'), t('count', '2'), t('id', 'A2')),
									t('item', t('value', 'A'), t('count', '3'), t('id', 'A3')),
									t('item', t('value', 'B'), t('count', '2'), t('id', 'B2'))
								),
								bind('/data/calc')
									.type('string')
									.calculate(
										"instance('instance')/root/item[value = /data/input1][count = '3']/id"
									),
								bind('/data/calc2')
									.type('string')
									.calculate(
										"instance('instance')/root/item[value = /data/input2][count = '3']/id"
									),
								bind('/data/input1').type('string'),
								bind('/data/input2').type('string')
							)
						),
						body(input('/data/input1'), input('/data/input2'))
					)
				);

				scenario.answer('/data/input1', 'A');
				scenario.answer('/data/input2', 'B');

				expect(scenario.answerOf('/data/calc').getValue()).toBe('A3');
				// assertThat(scenario.answerOf("/data/calc2"), equalTo(null));
				expect(scenario.answerOf('/data/calc2').getValue()).toBe('');
			});
		});

		describe('similar cmp and eq expressions', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * 1. Rephrase?
			 * 2. Failure is caused by `<` in the first `calculate` predicate. The
			 *    current DSL logic (which has been rechecked for consistency with
			 *    JavaRosa) appears to produce invalid XML in this case (and in
			 *    general does not do a lot of sanitization for attributes; I've seen
			 *    similar errors when authoring new fixtures with the DSL).
			 * 3. Test passes otherwise (with `<` escaped as `&lt;` in situ).
			 * 4. This is one example where JSX might be a good option for future
			 *    iteration on the DSL itself (as attributes/props are first class in
			 *    the JSX grammar, and escaping would be handled consistently without
			 *    special serialization logic).
			 */
			it.fails('[does] do not get confused', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(
									t('data id="some-form"', t('input'), t('calculate1'), t('calculate2'))
								),
								instance('instance', item('1', 'A'), item('2', 'B')),
								bind('/data/input').type('string'),
								bind('/data/calculate1')
									.type('string')
									.calculate("instance('instance')/root/item[value < /data/input]/label"),
								bind('/data/calculate2')
									.type('string')
									.calculate("instance('instance')/root/item[value = /data/input]/label")
							)
						),
						body(input('/data/input'))
					)
				);

				scenario.answer('/data/input', '2');

				expect(scenario.answerOf('/data/calculate1').getValue()).toBe('A');
				expect(scenario.answerOf('/data/calculate2').getValue()).toBe('B');
			});
		});

		describe('different eq expressions', () => {
			it('[is] are not confused', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(
									t('data id="some-form"', t('calc1'), t('calc2'), t('input1'), t('input2'))
								),
								instance('instance', item('a', 'A'), item('b', 'B')),
								bind('/data/calc1')
									.type('string')
									.calculate("instance('instance')/root/item[value = /data/input1]/label"),
								bind('/data/calc2')
									.type('string')
									.calculate("instance('instance')/root/item[label = /data/input2]/label"),
								bind('/data/input').type('string')
							)
						),
						body(input('/data/input1'), input('/data/input2'))
					)
				);

				scenario.answer('/data/input1', 'a');
				scenario.answer('/data/input2', 'B');

				expect(scenario.answerOf('/data/calc1').getValue()).toBe('A');
				expect(scenario.answerOf('/data/calc2').getValue()).toBe('B');
			});
		});

		describe('different kinds of eq expressions', () => {
			it('[is] are not confused', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(t('data id="some-form"', t('calc1'), t('calc2'), t('input'))),
								instance('instance', item('a', 'A'), item('b', 'B')),
								bind('/data/calc1')
									.type('string')
									.calculate("instance('instance')/root/item[value = 'a']/label"),
								bind('/data/calc2')
									.type('string')
									.calculate("instance('instance')/root/item[value != 'a']/label"),
								bind('/data/input').type('string')
							)
						),
						body(input('/data/input'))
					)
				);

				expect(scenario.answerOf('/data/calc1').getValue()).toBe('A');
				expect(scenario.answerOf('/data/calc2').getValue()).toBe('B');
			});
		});

		describe('repeat used in calculates', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * 1. Rephrase?
			 * 2. Null assertion -> blank/empty string
			 * 3. Super quick spike: this failure seems to fall into a broad class of
			 *    bugs, where certain reactive subscriptions are not updated until a
			 *    new repeat instance is added. In this case, it's probably because
			 *    (at best) `/data/repeat` would be identified as a dependency, when
			 *    the actual value it should subscribe to is `/data/repeat/name`
			 *    (which would imply predicate analysis, which we definitely do not
			 *    yet do).
			 * 4. This is another case where we'd almost certainly get a win from
			 *    {@link https://github.com/getodk/web-forms/issues/39 | decoupling XPath evaluation from the browser/XML DOM}
			 */
			it.fails('stay[s] up to date', async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('Some form'),
							model(
								mainInstance(
									t('data id="some-form"', t('repeat', t('name'), t('age')), t('result'))
								),
								bind('/data/repeat/input').type('string'),
								bind('/data/result')
									.type('string')
									.calculate("/data/repeat[name = 'John Bell']/age")
							)
						),
						body(
							group(
								'/data/repeat',
								repeat('/data/repeat', input('/data/repeat/name'), input('/data/repeat/age'))
							)
						)
					)
				);

				// assertThat(scenario.answerOf("/data/result"), equalTo(null));
				expect(scenario.answerOf('/data/result').getValue()).toBe('');

				scenario.createNewRepeat('/data/repeat');
				scenario.answer('/data/repeat[1]/name', 'John Bell');
				scenario.answer('/data/repeat[1]/age', '70');

				expect(scenario.answerOf('/data/result').getValue()).toBe('70');
			});
		});
	});
});
