import {
	bind,
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { expectedDistance } from '../../../src/answer/ExpectedApproximateUOMAnswer.ts';
import { Scenario } from '../../../src/jr/Scenario.ts';

/**
 * **PORTING NOTES**
 *
 * 1. There are quite a few other `distance` tests ported from JavaRosa, in
 *    {@link ../../data-types/geo.test.ts}. In hindsight, many (if not all) of
 *    the tests in that suite/module would be more appropriate here, or in an
 *    adjacent `area.test.ts` suite/module.
 *
 * 2. Whenever we add integration tests of XPath function behavior, I get a
 *    little bit cautious that we have two competing testing strategies for
 *    them. Unlike most of the ported JavaRosa tests, the current Web Forms
 *    project structure would probably prefer to have these functions tested in
 *    `@getodk/xpath`, as unit-ish tests. There's seldom (if ever) anything
 *    _about an XPath function_ which warrants an integration test.
 *
 * 3. On the other hand, we've recently had some renewed discussion about the
 *    future of that package's responsibilities: i.e. whether it might make more
 *    sense to implement ODK XForms extensions downstream (either in
 *    `@getodk/xforms-engine`, or in some intermediate package). In which case,
 *    we'd want to reconsider some of the testing strategy broadly. I'm still
 *    not sure there's much value in integration tests of XPath function
 *    behavior! But the existing XPath tests are also ported (from
 *    `openrosa-xpath-evaluator`); if they were to move, we'd also have an
 *    opportunity to bring those tests more in line with project goals/idioms.
 */
describe('XPath function support: `distance`', () => {
	describe('GeoDistanceTest.java', () => {
		// JR: distance_isComputedForInlineString
		it('computes distance for a string (Literal) argument', async () => {
			// prettier-ignore
			const scenario = await Scenario.init('string distance', html(
				head(
					title('String distance'),
					model(
						mainInstance(t('data id="string-distance"',
							t('point1', '38.253094215699576 21.756382658677467 0 0'),
							t('point2', '38.25021274773806 21.756382658677467 0 0'),
							t('point3', '38.25007793942195 21.763892843919166 0 0'),
							t('point4', '38.25290886154963 21.763935759263404 0 0'),
							t('point5', '38.25146813817506 21.758421137528785 0 0'),
							t('distance')
						)),
						bind('/data/point1').type('geopoint'),
						bind('/data/point2').type('geopoint'),
						bind('/data/point3').type('geopoint'),
						bind('/data/point4').type('geopoint'),
						bind('/data/point5').type('geopoint'),
						bind('/data/distance').type('decimal').calculate("distance(concat(/data/point1, ';', /data/point2, ';', /data/point3, ';', /data/point4, ';', /data/point5))")
					)),
				body(
					input('/data/point1')
				)
			));

			// JR:
			//
			// // http://www.mapdevelopers.com/area_finder.php?&points=%5B%5B38.253094215699576%2C21.756382658677467%5D%2C%5B38.25021274773806%2C21.756382658677467%5D%2C%5B38.25007793942195%2C21.763892843919166%5D%2C%5B38.25290886154963%2C21.763935759263404%5D%2C%5B38.25146813817506%2C21.758421137528785%5D%5D
			// assertThat(Double.parseDouble(scenario.answerOf("/data/distance").getDisplayText()),
			// 		IsCloseTo.closeTo(1801, 0.5));

			expect(scenario.answerOf('/data/distance')).toHaveAnswerCloseTo(expectedDistance(1801, 0.5));
		});

		/**
		 * **PORTING NOTES**
		 *
		 * Adapts JavaRosa's use of `try`/`catch` to typical Web Forms error
		 * condition assertion style.
		 *
		 * @todo The shape of this test may change (like many others) when we
		 * address error production broadly.
		 */
		// JR: distance_throwsForNonPoint
		it('produces an error when the string value is not a valid point', async () => {
			const init = async () => {
				// prettier-ignore
				await Scenario.init('string distance', html(
						head(
							title('String distance'),
							model(
								mainInstance(t('data id="string-distance"',
									t('distance')
								)),
								bind('/data/distance').type('decimal').calculate("distance('foo')")
							)),
						body(
							input('distance')
						)
				));
			};

			// **PORTING NOTES**
			//
			// We've currently copied this error message verbatim.
			await expect(init).rejects.toThrowError(
				"The function 'distance' received a value that does not represent GPS coordinates"
			);
		});

		/**
		 * **PORTING NOTES**
		 *
		 * The difference in language here is semantically important! Note that the
		 * JavaRosa test name references "path" arguments, but the test exercises a
		 * spec expansion where the path may be composed of multiple **point**
		 * arguments.
		 */
		// JR: distance_isComputedForMultiplePathArguments
		it('computes a distance from multiple node-set arguments, where each node has a `geopoint` value', async () => {
			// prettier-ignore
			const scenario = await Scenario.init('string distance', html(
				head(
					title('Multi parameter distance'),
					model(
						mainInstance(t('data id="string-distance"',
							t('point1', '38.253094215699576 21.756382658677467 0 0'),
							t('point2', '38.25021274773806 21.756382658677467 0 0'),
							t('point3', '38.25007793942195 21.763892843919166 0 0'),
							t('point4', '38.25290886154963 21.763935759263404 0 0'),
							t('point5', '38.25146813817506 21.758421137528785 0 0'),
							t('distance')
						)),
						bind('/data/point1').type('geopoint'),
						bind('/data/point2').type('geopoint'),
						bind('/data/point3').type('geopoint'),
						bind('/data/point4').type('geopoint'),
						bind('/data/point5').type('geopoint'),
						bind('/data/distance').type('decimal').calculate('distance(/data/point1, /data/point2, /data/point3, /data/point4, /data/point5)')
					)),
				body(
					input('/data/point1')
				)
			));

			// JR:
			//
			// // http://www.mapdevelopers.com/area_finder.php?&points=%5B%5B38.253094215699576%2C21.756382658677467%5D%2C%5B38.25021274773806%2C21.756382658677467%5D%2C%5B38.25007793942195%2C21.763892843919166%5D%2C%5B38.25290886154963%2C21.763935759263404%5D%2C%5B38.25146813817506%2C21.758421137528785%5D%5D
			// assertThat(Double.parseDouble(scenario.answerOf("/data/distance").getDisplayText()),
			// 		IsCloseTo.closeTo(1801, 0.5));

			expect(scenario.answerOf('/data/distance')).toHaveAnswerCloseTo(expectedDistance(1801, 0.5));
		});

		// JR: distance_isComputedForMixedPathAndStringArguments
		it('computes a distance from mixed node-set and string (Literal) arguments', async () => {
			// prettier-ignore
			const scenario = await Scenario.init('string distance', html(
				head(
					title('Multi parameter distance'),
					model(
						mainInstance(t('data id="string-distance"',
							t('point2', '38.25021274773806 21.756382658677467 0 0'),
							t('point3', '38.25007793942195 21.763892843919166 0 0'),
							t('point5', '38.25146813817506 21.758421137528785 0 0'),
							t('distance')
						)),
						bind('/data/point2').type('geopoint'),
						bind('/data/point3').type('geopoint'),
						bind('/data/point5').type('geopoint'),
						bind('/data/distance').type('decimal').calculate("distance('38.253094215699576 21.756382658677467 0 0', /data/point2, /data/point3, '38.25290886154963 21.763935759263404 0 0', /data/point5)")
					)),
				body(
					input('/data/point2')
				)
			));

			// JR:
			//
			// // http://www.mapdevelopers.com/area_finder.php?&points=%5B%5B38.253094215699576%2C21.756382658677467%5D%2C%5B38.25021274773806%2C21.756382658677467%5D%2C%5B38.25007793942195%2C21.763892843919166%5D%2C%5B38.25290886154963%2C21.763935759263404%5D%2C%5B38.25146813817506%2C21.758421137528785%5D%5D
			// assertThat(Double.parseDouble(scenario.answerOf("/data/distance").getDisplayText()),
			// 		IsCloseTo.closeTo(1801, 0.5));

			expect(scenario.answerOf('/data/distance')).toHaveAnswerCloseTo(expectedDistance(1801, 0.5));
		});
	});

	describe('multiple arguments, mixed value types', () => {
		it('produces an error for a non-geopoint value in a multiple argument call', async () => {
			const init = async () => {
				await Scenario.init(
					'geoshape distance',
					html(
						head(
							title('Geoshape distance'),
							model(
								mainInstance(
									t(
										'data id="geoshape-distance"',
										t('polygon-start-trace', '0 1 0 0; 0 91 0 0;'),
										t('polygon-close-point', '0 1 0 0'),
										t('distance')
									)
								),
								bind('/data/polygon-start-trace').type('geotrace'),
								bind('/data/polygon-close-point').type('geopoint'),
								bind('/data/distance')
									.type('decimal')
									.calculate('distance(/data/polygon-start-trace, /data/polygon-close-point)')
							)
						),
						body(input('/data/polygon-start-trace'), input('/data/polygon-close-point'))
					)
				);
			};

			await expect(init).rejects.toThrowError(
				"The function 'distance' received a value that does not represent GPS coordinates"
			);
		});
	});
});
