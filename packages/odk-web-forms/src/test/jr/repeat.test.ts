import { createRoot } from 'solid-js';
import { describe, it } from 'vitest';
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
} from '../fixtures/xform-dsl/index.ts';
import { Scenario } from '../scenario/Scenario.ts';
import { CoreMatchers, assertThat, intAnswer } from '../scenario/assert.ts';

describe('Tests ported from JavaRosa - repeats', () => {
	describe('Adding or deleting repeats', () => {
		describe('adding repeat instance', () => {
			// https://github.com/getodk/javarosa/blob/059321160e6f8dbb3e81d9add61d68dd35b13cc8/src/test/java/org/javarosa/core/model/TriggerableDagTest.java#L785
			it('updates calculation cascade', () => {
				createRoot(() => {
					// prettier-ignore
					const scenario = Scenario.init("Add repeat instance", html(
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

					assertThat(scenario.answerOf('/data/repeat[1]/inner2'), CoreMatchers.is(intAnswer(0)));
					assertThat(scenario.answerOf('/data/repeat[1]/inner3'), CoreMatchers.is(intAnswer(0)));

					scenario.next('/data/repeat');
					scenario.createNewRepeat('/data/repeat');
					scenario.next('/data/repeat[2]/inner1');

					scenario.answer(1);

					assertThat(scenario.answerOf('/data/repeat[2]/inner2'), CoreMatchers.is(intAnswer(2)));
					assertThat(scenario.answerOf('/data/repeat[2]/inner3'), CoreMatchers.is(intAnswer(4)));
				});
			});
		});
	});
});
