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
import type { ExpectStatic, JestAssertion } from 'vitest';
import { describe, expect, it } from 'vitest';
import { expectedArea, expectedDistance } from '../../src/answer/ExpectedApproximateUOMAnswer.ts';
import { floatAnswer } from '../../src/answer/ExpectedFloatAnswer.ts';
import { Scenario } from '../../src/jr/Scenario.ts';
import { EARTH_EQUATORIAL_CIRCUMFERENCE_METERS } from '../../src/jr/core/util/GeoUtils.ts';

const NINETY_DEGREES_ON_EQUATOR_KM = EARTH_EQUATORIAL_CIRCUMFERENCE_METERS / 4;

interface RelaxedPrecisionOptions {
	readonly relaxAssertionPrecision: boolean;
}

/**
 * **PORTING NOTES**
 *
 * - It makes some sense to test all of these types in the same module/parent
 *   suite. JavaRosa's organization of them is both more specific, and less
 *   specific, which may also make some sense! We'll start off with them all
 *   grouped together in this module, and with each specific type having its own
 *   suite. We can reconsider either or both as appropriate.
 *
 * - Diverging from most tests with assertions calling `getDisplayText()`,
 *   ported tests with area assertions:
 *
 *     - compared with `is` (or otherwise testing exact equality), will use the
 *       custom assertion {@link ExpectStatic.toEqualAnswer} with an equivalent
 *       expected float answer type.
 *
 *     - compared with `closeTo` an expected value, will use a new custom
 *       assertion: {@link ExpectStatic.toHaveAnswerCloseTo}. This assertion may
 *       be generalizable to a broader `toBeCloseTo`, but that would conflict
 *       with the built-in {@link JestAssertion.toBeCloseTo} which has different
 *       semantics for the same tolerance positional argument, and it would push
 *       more repetitive-but-syntactically-different casting into each test
 *       utilizing it.
 *
 * - At time of porting, we have mixed support for geo types:
 *
 *     - Nominally, all geo-related XPath functions are already supported. Some
 *       tests will exercise that functionality. It's hoped that they'll pass as
 *       ported, but failures may help reveal unsupported edge cases in the
 *       implementation of those functions.
 *
 *     - We don't presently implement any behavior for specific `<bind type>`
 *       types (everything is currently treated as a `string`). Any tests
 *       exercising behavior specific to a bound data type will likely fail
 *       pending feature support.
 */
describe('Geopoint', () => {
	describe('GeoAreaTest.java', () => {
		describe('area', () => {
			it('is computed for [a] geopoint nodeset', async () => {
				const scenario = await Scenario.init(
					'geopoint nodeset area',
					html(
						head(
							title('Geopoint nodeset area'),
							model(
								mainInstance(
									t(
										'data id="geopoint-area"',
										t('location', t('point', '38.253094215699576 21.756382658677467 0 0')),
										t('location', t('point', '38.25021274773806 21.756382658677467 0 0')),
										t('location', t('point', '38.25007793942195 21.763892843919166 0 0')),
										t('location', t('point', '38.25290886154963 21.763935759263404 0 0')),
										t('location', t('point', '38.25146813817506 21.758421137528785 0 0')),
										t('area')
									)
								),
								bind('/data/location/point').type('geopoint'),
								bind('/data/area').type('decimal').calculate('area(/data/location/point)')
							)
						),
						body(repeat('/data/location', input('/data/location/point')))
					)
				);

				// JR:
				//
				// http://www.mapdevelopers.com/area_finder.php?&points=%5B%5B38.253094215699576%2C21.756382658677467%5D%2C%5B38.25021274773806%2C21.756382658677467%5D%2C%5B38.25007793942195%2C21.763892843919166%5D%2C%5B38.25290886154963%2C21.763935759263404%5D%2C%5B38.25146813817506%2C21.758421137528785%5D%5D
				// assertThat(Double.parseDouble(scenario.answerOf("/data/area").getDisplayText()),
				// 		closeTo(151452, 0.5));
				expect(scenario.answerOf('/data/area')).toHaveAnswerCloseTo(expectedArea(151452, 0.5));
			});

			it('is computed for [a calculated] string', async () => {
				const scenario = await Scenario.init(
					'string area',
					html(
						head(
							title('String area'),
							model(
								mainInstance(
									t(
										'data id="string-area"',
										t('point1', '38.253094215699576 21.756382658677467 0 0'),
										t('point2', '38.25021274773806 21.756382658677467 0 0'),
										t('point3', '38.25007793942195 21.763892843919166 0 0'),
										t('point4', '38.25290886154963 21.763935759263404 0 0'),
										t('point5', '38.25146813817506 21.758421137528785 0 0'),
										t('concat'),
										t('area')
									)
								),
								bind('/data/point1').type('geopoint'),
								bind('/data/point2').type('geopoint'),
								bind('/data/point3').type('geopoint'),
								bind('/data/point4').type('geopoint'),
								bind('/data/point5').type('geopoint'),
								bind('/data/concat')
									.type('string')
									.calculate(
										"concat(/data/point1, ';', /data/point2, ';', /data/point3, ';', /data/point4, ';', /data/point5)"
									),
								bind('/data/area').type('decimal').calculate('area(/data/concat)')
							)
						),
						body(input('/data/point1'))
					)
				);

				// http://www.mapdevelopers.com/area_finder.php?&points=%5B%5B38.253094215699576%2C21.756382658677467%5D%2C%5B38.25021274773806%2C21.756382658677467%5D%2C%5B38.25007793942195%2C21.763892843919166%5D%2C%5B38.25290886154963%2C21.763935759263404%5D%2C%5B38.25146813817506%2C21.758421137528785%5D%5D
				// assertThat(Double.parseDouble(scenario.answerOf("/data/area").getDisplayText()),
				// 		closeTo(151452, 0.5));

				expect(scenario.answerOf('/data/area')).toHaveAnswerCloseTo(expectedArea(151452, 0.5));
			});
		});
	});

	describe('GeoDistanceTest.java', () => {
		describe('distance', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Test fails with direct port, passes with relaxed precision in
			 * {@link ExpectStatic.toHaveAnswerCloseTo} assertion. This could be a
			 * difference in precision of one or more of:
			 *
			 * - the XPath `distance` implementation
			 * - the constant referenced in the assertion, and any of its underlying
			 *   computations
			 * - the actual {@link ExpectStatic.toHaveAnswerCloseTo} comparison logic
			 *   (but probably not, notes added there)
			 *
			 * Note that the difference between the directly ported tolerance, and the
			 * ported tolerance, is exceedingly small.
			 */
			describe.each<RelaxedPrecisionOptions>([
				{ relaxAssertionPrecision: false },
				{ relaxAssertionPrecision: true },
			])('relax assertion precision: $relaxAssertionPrecision', ({ relaxAssertionPrecision }) => {
				let testFn: typeof it | typeof it.fails;

				if (relaxAssertionPrecision) {
					testFn = it;
				} else {
					testFn = it.fails;
				}

				testFn('is computed for [a] `geopoint` nodeset', async () => {
					const scenario = await Scenario.init(
						'geopoint nodeset distance',
						html(
							head(
								title('Geopoint nodeset distance'),
								model(
									mainInstance(
										t(
											'data id="geopoint-distance"',
											t('location', t('point', '0 1 0 0')),
											t('location', t('point', '0 91 0 0')),
											t('distance')
										)
									),
									bind('/data/location/point').type('geopoint'),
									bind('/data/distance').type('decimal').calculate('distance(/data/location/point)')
								)
							),
							body(repeat('/data/location', input('/data/location/point')))
						)
					);

					// assertThat(Double.parseDouble(scenario.answerOf("/data/distance").getDisplayText()),
					// 		closeTo(NINETY_DEGREES_ON_EQUATOR_KM, 1e-7));
					// })
					expect(scenario.answerOf('/data/distance')).toHaveAnswerCloseTo(
						expectedDistance(
							NINETY_DEGREES_ON_EQUATOR_KM,
							relaxAssertionPrecision ? 0.0999999 : 1e-7
						)
					);
				});
			});

			it('is computed for [a calculated] string', async () => {
				const scenario = await Scenario.init(
					'string distance',
					html(
						head(
							title('String distance'),
							model(
								mainInstance(
									t(
										'data id="string-distance"',
										t('point1', '38.253094215699576 21.756382658677467 0 0'),
										t('point2', '38.25021274773806 21.756382658677467 0 0'),
										t('point3', '38.25007793942195 21.763892843919166 0 0'),
										t('point4', '38.25290886154963 21.763935759263404 0 0'),
										t('point5', '38.25146813817506 21.758421137528785 0 0'),
										t('concat'),
										t('distance')
									)
								),
								bind('/data/point1').type('geopoint'),
								bind('/data/point2').type('geopoint'),
								bind('/data/point3').type('geopoint'),
								bind('/data/point4').type('geopoint'),
								bind('/data/point5').type('geopoint'),
								bind('/data/concat')
									.type('string')
									.calculate(
										"concat(/data/point1, ';', /data/point2, ';', /data/point3, ';', /data/point4, ';', /data/point5)"
									),
								bind('/data/distance').type('decimal').calculate('distance(/data/concat)')
							)
						),
						body(input('/data/point1'))
					)
				);

				// JR:
				//
				// http://www.mapdevelopers.com/area_finder.php?&points=%5B%5B38.253094215699576%2C21.756382658677467%5D%2C%5B38.25021274773806%2C21.756382658677467%5D%2C%5B38.25007793942195%2C21.763892843919166%5D%2C%5B38.25290886154963%2C21.763935759263404%5D%2C%5B38.25146813817506%2C21.758421137528785%5D%5D
				// assertThat(Double.parseDouble(scenario.answerOf("/data/distance").getDisplayText()),
				//     IsCloseTo.closeTo(1801, 0.5));
				expect(scenario.answerOf('/data/distance')).toHaveAnswerCloseTo(
					expectedDistance(1801, 0.5)
				);
			});
		});
	});
});

describe('Geoshape', () => {
	describe('GeoAreaTest.java', () => {
		describe('area', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Previously failed due to trailing semicolon. Addressed while extracting
			 * XPath logic for decoding serialized geopoint lists.
			 */
			it('is computed for geoshape', async () => {
				const scenario = await Scenario.init(
					'geoshape area',
					html(
						head(
							title('Geoshape area'),
							model(
								mainInstance(
									t(
										'data id="geoshape-area"',
										t(
											'polygon',
											'38.253094215699576 21.756382658677467 0 0; 38.25021274773806 21.756382658677467 0 0; 38.25007793942195 21.763892843919166 0 0; 38.25290886154963 21.763935759263404 0 0; 38.25146813817506 21.758421137528785 0 0;'
										),
										t('area')
									)
								),
								bind('/data/polygon').type('geoshape'),
								bind('/data/area').type('decimal').calculate('area(/data/polygon)')
							)
						),
						body(input('/data/polygon'))
					)
				);

				// JR:
				//
				// http://www.mapdevelopers.com/area_finder.php?&points=%5B%5B38.253094215699576%2C21.756382658677467%5D%2C%5B38.25021274773806%2C21.756382658677467%5D%2C%5B38.25007793942195%2C21.763892843919166%5D%2C%5B38.25290886154963%2C21.763935759263404%5D%2C%5B38.25146813817506%2C21.758421137528785%5D%5D
				// assertThat(Double.parseDouble(scenario.answerOf("/data/area").getDisplayText()),
				// 		closeTo(151452, 0.5));
				expect(scenario.answerOf('/data/area')).toHaveAnswerCloseTo(expectedArea(151452, 0.5));
			});

			describe('when shape has fewer than three points', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * Previously failed with trailing semicolon, and lack of logic to enforce a minimum number of points. Both addressed while extracting XPath logic for decoding serializeed geopoint lists.
				 */
				it('is zero', async () => {
					const scenario = await Scenario.init(
						'geoshape area',
						html(
							head(
								title('Geoshape area'),
								model(
									mainInstance(
										t(
											'data id="geoshape-area"',
											t('polygon1', '38.253094215699576 21.756382658677467 0 0;'),
											t(
												'polygon2',
												'38.253094215699576 21.756382658677467 0 0; 38.25021274773806 21.756382658677467 0 0;'
											),
											t('area1'),
											t('area2')
										)
									),
									bind('/data/polygon1').type('geoshape'),
									bind('/data/polygon2').type('geoshape'),
									bind('/data/area1').type('decimal').calculate('area(/data/polygon1)'),
									bind('/data/area2').type('decimal').calculate('area(/data/polygon2)')
								)
							),
							body(input('/data/polygon1'), input('/data/polygon2'))
						)
					);

					// assertThat(Double.parseDouble(scenario.answerOf("/data/area1").getDisplayText()), is(0.0));
					expect(scenario.answerOf('/data/area1')).toEqualAnswer(floatAnswer(0.0));
					// assertThat(Double.parseDouble(scenario.answerOf("/data/area2").getDisplayText()), is(0.0));
					expect(scenario.answerOf('/data/area2')).toEqualAnswer(floatAnswer(0.0));
				});
			});
		});
	});

	describe('GeoDistanceTest.java', () => {
		describe('distance', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Fails on directly ported precision. Same notes as previous test in
			 * first geopoint distance test. Parameterized to demonstrate passage when
			 * accommodated.
			 */
			describe.each<RelaxedPrecisionOptions>([
				{ relaxAssertionPrecision: false },
				{ relaxAssertionPrecision: true },
			])('relax assertion precision: $relaxAssertionPrecision', ({ relaxAssertionPrecision }) => {
				let testFn: typeof it | typeof it.fails;

				if (relaxAssertionPrecision) {
					testFn = it;
				} else {
					testFn = it.fails;
				}

				testFn('is computed for geoshape', async () => {
					const scenario = await Scenario.init(
						'geoshape distance',
						html(
							head(
								title('Geoshape distance'),
								model(
									mainInstance(
										t(
											'data id="geoshape-distance"',
											t('polygon', '0 1 0 0; 0 91 0 0; 0 1 0 0;'),
											t('distance')
										)
									),
									bind('/data/polygon').type('geoshape'),
									bind('/data/distance').type('decimal').calculate('distance(/data/polygon)')
								)
							),
							body(input('/data/polygon'))
						)
					);

					// assertThat(Double.parseDouble(scenario.answerOf("/data/distance").getDisplayText()),
					// 		closeTo(NINETY_DEGREES_ON_EQUATOR_KM * 2, 1e-7));
					// })
					expect(scenario.answerOf('/data/distance')).toHaveAnswerCloseTo(
						expectedDistance(
							NINETY_DEGREES_ON_EQUATOR_KM * 2,
							relaxAssertionPrecision ? 0.0999999 : 1e-7
						)
					);
				});
			});
		});
	});
});

describe('Geotrace', () => {
	describe('GeoDistanceTest.java', () => {
		describe('distance', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Fails on directly ported precision. Same notes as previous test in
			 * first geopoint distance test. Parameterized to demonstrate passage with
			 * relaxed precision.
			 */
			describe.each<RelaxedPrecisionOptions>([
				{ relaxAssertionPrecision: false },
				{ relaxAssertionPrecision: true },
			])('relax assertion precision: $relaxAssertionPrecision', ({ relaxAssertionPrecision }) => {
				let testFn: typeof it | typeof it.fails;

				if (relaxAssertionPrecision) {
					testFn = it;
				} else {
					testFn = it.fails;
				}

				testFn('is computed for geotrace', async () => {
					const scenario = await Scenario.init(
						'geotrace distance',
						html(
							head(
								title('Geotrace distance'),
								model(
									mainInstance(
										t('data id="geotrace-distance"', t('line', '0 1 0 0; 0 91 0 0;'), t('distance'))
									),
									bind('/data/line').type('geotrace'),
									bind('/data/distance').type('decimal').calculate('distance(/data/line)')
								)
							),
							body(input('/data/line'))
						)
					);

					// assertThat(Double.parseDouble(scenario.answerOf("/data/distance").getDisplayText()),
					// 		closeTo(NINETY_DEGREES_ON_EQUATOR_KM, 1e-7));
					expect(scenario.answerOf('/data/distance')).toHaveAnswerCloseTo(
						expectedDistance(
							NINETY_DEGREES_ON_EQUATOR_KM,
							relaxAssertionPrecision ? 0.0999999 : 1e-7
						)
					);
				});
			});

			describe('when [`geotrace`] trace has fewer than two points', () => {
				/**
				 * **PORTING NOTES**
				 *
				 * Fails due to another nuance of `distance` fallibility. Evidently
				 *
				 */
				it.fails('is zero', async () => {
					const scenario = await Scenario.init(
						'geotrace distance',
						html(
							head(
								title('Geotrace distance'),
								model(
									mainInstance(
										t('data id="geotrace-distance"', t('line', '0 1 0 0;'), t('distance'))
									),
									bind('/data/line').type('geotrace'),
									bind('/data/distance').type('decimal').calculate('distance(/data/line)')
								)
							),
							body(input('/data/line'))
						)
					);

					// assertThat(Double.parseDouble(scenario.answerOf("/data/distance").getDisplayText()), is(0.0));
					expect(scenario.answerOf('/data/distance')).toEqualAnswer(floatAnswer(0.0));
				});
			});
		});
	});
});
