import {
	bind,
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	repeat,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { intAnswer } from '../src/answer/ExpectedIntAnswer.ts';
import { stringAnswer } from '../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';

describe('Tests ported from JavaRosa - repeats', () => {
	describe('Adding or deleting repeats', () => {
		describe('adding repeat instance', () => {
			// https://github.com/getodk/javarosa/blob/059321160e6f8dbb3e81d9add61d68dd35b13cc8/src/test/java/org/javarosa/core/model/TriggerableDagTest.java#L785
			it('updates calculation cascade', async () => {
				// prettier-ignore
				const scenario = await Scenario.init("Add repeat instance", html(
					head(
							title("Add repeat instance"),
							model(
									mainInstance(t("data id=\"repeat-calcs\"",
											t("repeat",
													t("inner1"),
													t("inner2"),
													t("inner3")
											))),
									bind("/data/repeat/inner2").calculate("2 * ../inner1"),
									bind("/data/repeat/inner3").calculate("2 * ../inner2"))),

					body(
							repeat("/data/repeat",
									input("/data/repeat/inner1"))
					)));

				scenario.next('/data/repeat[1]');
				scenario.next('/data/repeat[1]/inner1');
				scenario.answer(0);

				expect(scenario.answerOf('/data/repeat[1]/inner2')).toEqualAnswer(intAnswer(0));
				expect(scenario.answerOf('/data/repeat[1]/inner3')).toEqualAnswer(intAnswer(0));

				scenario.next('/data/repeat');
				scenario.createNewRepeat({ assertCurrentReference: '/data/repeat' });
				scenario.next('/data/repeat[2]/inner1');

				scenario.answer(1);

				expect(scenario.answerOf('/data/repeat[2]/inner2')).toEqualAnswer(intAnswer(2));
				expect(scenario.answerOf('/data/repeat[2]/inner3')).toEqualAnswer(intAnswer(4));
			});

			describe('updates inner calculations with multiple dependencies', () => {
				// This test currently fails due to use of absolute XPath expression
				// into repeat instance, which is not contextualized to the position
				// of its pertinent repeat instance.
				//
				// Note: this is now marked as `fails` rather than `todo` because...
				//
				// 1. It's now considered an expected failure; this is legacy behavior
				//    in JavaRosa that we currently consider out of scope.
				// 2. It's possible that future changes may actually make it pass. For
				//    instance, the current dependency resolution logic would probably
				//    come close to satisfying it; decoupling XPath evaluation from the
				//    browser/XML DOM without any further change to that logic could
				//    conceivably make this test pass.
				// 3. We very likely want to know **more generally** when tests
				//    exercising known failures no longer fail.
				it.fails('(absolute path, from JavaRosa)', async () => {
					// prettier-ignore
					const scenario = await Scenario.init("Repeat cascading calc", html(
						head(
								title("Repeat cascading calc"),
								model(
										mainInstance(t("data id=\"repeat-calcs\"",
												t("repeat",
														t("position"),
														t("position_2"),
														t("other"),
														t("concatenated")
												))),
										// position(..) means the full cascade is evaulated as part of triggerTriggerables
										bind("/data/repeat/position").calculate("position(..)"),
										bind("/data/repeat/position_2").calculate("/data/repeat/position * 2"),
										bind("/data/repeat/other").calculate("2 * 2"),
										// concat needs to be evaluated after /data/repeat/other has a value
										bind("/data/repeat/concatenated").calculate("concat(../position_2, '-', ../other)"))),
						body(
								repeat("/data/repeat",
										input("/data/repeat/concatenated"))
						)));

					scenario.next('/data/repeat[1]');
					scenario.next('/data/repeat[1]/concatenated');
					expect(scenario.answerOf('/data/repeat[1]/concatenated')).toEqualAnswer(
						stringAnswer('2-4')
					);

					scenario.next('/data/repeat');
					scenario.createNewRepeat({ assertCurrentReference: '/data/repeat' });

					scenario.next('/data/repeat[2]/concatenated');
					expect(scenario.answerOf('/data/repeat[2]/concatenated')).toEqualAnswer(
						stringAnswer('4-4')
					);
				});

				it('(updated to be consistent with current pyxform output)', async () => {
					// prettier-ignore
					const scenario = await Scenario.init("Repeat cascading calc", html(
						head(
								title("Repeat cascading calc"),
								model(
										mainInstance(t("data id=\"repeat-calcs\"",
												t("repeat",
														t("position"),
														t("position_2"),
														t("other"),
														t("concatenated")
												))),
										// position(..) means the full cascade is evaulated as part of triggerTriggerables
										bind("/data/repeat/position").calculate("position(..)"),
										bind("/data/repeat/position_2").calculate("../position * 2"),
										bind("/data/repeat/other").calculate("2 * 2"),
										// concat needs to be evaluated after /data/repeat/other has a value
										bind("/data/repeat/concatenated").calculate("concat(../position_2, '-', ../other)"))),
						body(
								repeat("/data/repeat",
										input("/data/repeat/concatenated"))
						)));

					scenario.next('/data/repeat[1]');
					scenario.next('/data/repeat[1]/concatenated');
					expect(scenario.answerOf('/data/repeat[1]/concatenated')).toEqualAnswer(
						stringAnswer('2-4')
					);

					scenario.next('/data/repeat');
					scenario.createNewRepeat({ assertCurrentReference: '/data/repeat' });

					scenario.next('/data/repeat[2]/concatenated');
					expect(scenario.answerOf('/data/repeat[2]/concatenated')).toEqualAnswer(
						stringAnswer('4-4')
					);
				});
			});
		});
	});
});
